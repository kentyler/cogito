(ns cogito.semantic-map
  (:require [re-frame.core :as rf]
            [reagent.core :as r]))

;; Events
(rf/reg-event-db
 ::set-current-meeting
 (fn [db [_ meeting-id]]
   (assoc db :map/current-meeting meeting-id)))

(rf/reg-event-fx
 ::load-embeddings
 (fn [{:keys [db]} [_ block-id]]
   (-> (js/fetch (str "/api/meetings/" block-id "/embeddings")
                  #js {:credentials "same-origin"})
       (.then #(.json %))
       (.then (fn [data]
                (js/console.log "Raw API response:" data)
                (let [clj-data (js->clj data :keywordize-keys true)]
                  (js/console.log "Converted data:" (clj->js clj-data))
                  (rf/dispatch [::embeddings-loaded clj-data]))))
       (.catch (fn [error]
                 (js/console.error "API error:" error)
                 (rf/dispatch [::embeddings-load-failed (str error)]))))
   {:db (assoc db :map/loading? true)}))

(rf/reg-event-db
 ::embeddings-loaded
 (fn [db [_ data]]
   (-> db
       (assoc :map/embeddings (:embeddings data))
       (assoc :map/stats (:stats data))
       (assoc :map/loading? false))))

(rf/reg-event-db
 ::embeddings-load-failed
 (fn [db [_ error]]
   (-> db
       (assoc :map/error error)
       (assoc :map/loading? false))))

(rf/reg-event-db
 ::set-selected-turn
 (fn [db [_ turn]]
   (assoc db :map/selected-turn turn)))

(rf/reg-event-db
 ::set-hovered-turn
 (fn [db [_ turn]]
   (assoc db :map/hovered-turn turn)))

;; Subscriptions
(rf/reg-sub
 ::current-meeting
 (fn [db _]
   (:map/current-meeting db)))

(rf/reg-sub
 ::current-meeting-data
 :<- [:cogito.meetings/meetings]
 :<- [::current-meeting]
 (fn [[meetings current-id] _]
   (when (and meetings current-id)
     (first (filter #(= (:block_id %) current-id) meetings)))))

(rf/reg-sub
 ::embeddings
 (fn [db _]
   (:map/embeddings db)))

(rf/reg-sub
 ::loading?
 (fn [db _]
   (:map/loading? db)))

(rf/reg-sub
 ::error
 (fn [db _]
   (:map/error db)))

(rf/reg-sub
 ::selected-turn
 (fn [db _]
   (:map/selected-turn db)))

(rf/reg-sub
 ::hovered-turn
 (fn [db _]
   (:map/hovered-turn db)))

;; Helper functions
(defn get-participant-color [participant-name]
  (let [colors ["#3B82F6" "#10B981" "#F59E0B" "#EF4444" "#8B5CF6" "#EC4899" "#06B6D4" "#84CC16"]
        hash (reduce + 0 (map int (or participant-name "Unknown")))]
    (nth colors (mod hash (count colors)))))

(defn format-timestamp [timestamp]
  (when timestamp
    (-> timestamp
        (js/Date.)
        (.toLocaleString))))

;; Components
(defn participant-legend [embeddings]
  (let [participants (->> embeddings
                         (map :participant_name)
                         (remove nil?)
                         (distinct)
                         (sort))]
    [:div {:class "mb-4 p-3 bg-white border border-gray-200 rounded-lg"}
     [:h4 {:class "text-sm font-medium text-gray-700 mb-2"} "Participants"]
     [:div {:class "flex flex-wrap gap-2"}
      (for [participant participants]
        ^{:key participant}
        [:div {:class "flex items-center gap-1"}
         [:div {:class "w-3 h-3 rounded-full"
                :style {:background-color (get-participant-color participant)}}]
         [:span {:class "text-xs text-gray-600"} participant]])]]))

(defn turn-detail-pane []
  (let [selected-turn (rf/subscribe [::selected-turn])]
    (fn []
      [:div {:class "bg-white border border-gray-200 rounded-lg p-4 overflow-y-auto h-full"}
       (if @selected-turn
         [:div
          [:div {:class "mb-4 flex justify-between items-center"}
           [:h3 {:class "text-lg font-medium text-gray-900"} "Turn Details"]
           [:button {:class "text-gray-400 hover:text-gray-600 text-xl"
                     :on-click #(rf/dispatch [::set-selected-turn nil])}
            "×"]]
          
          [:div {:class "space-y-4"}
           [:div
            [:label {:class "block text-sm font-medium text-gray-700"} "Participant"]
            [:div {:class "flex items-center gap-2"}
             [:div {:class "w-3 h-3 rounded-full"
                    :style {:background-color (get-participant-color (:participant_name @selected-turn))}}]
             [:p {:class "text-sm text-gray-900"} (or (:participant_name @selected-turn) "Unknown")]]]
           
           [:div
            [:label {:class "block text-sm font-medium text-gray-700"} "Source"]
            [:p {:class "text-sm text-gray-900"} (:source_type @selected-turn)]]
           
           [:div
            [:label {:class "block text-sm font-medium text-gray-700"} "Time"]
            [:p {:class "text-sm text-gray-900"} (format-timestamp (:created_at @selected-turn))]]
           
           [:div
            [:label {:class "block text-sm font-medium text-gray-700"} "Content"]
            [:div {:class "mt-1 p-3 bg-gray-50 rounded-md max-h-60 overflow-y-auto"}
             [:p {:class "text-sm text-gray-900 whitespace-pre-wrap"} (:content @selected-turn)]]]
           
           [:div
            [:label {:class "block text-sm font-medium text-gray-700"} "Turn Order"]
            [:p {:class "text-sm text-gray-900"} (:turn_order @selected-turn)]]]]
         
         [:div {:class "flex items-center justify-center h-full"}
          [:p {:class "text-gray-500 text-sm text-center"} "Click on a turn to view details"]])])))

(defn semantic-map-visualization []
  (let [embeddings (rf/subscribe [::embeddings])
        loading? (rf/subscribe [::loading?])
        error (rf/subscribe [::error])
        hovered-turn (rf/subscribe [::hovered-turn])
        selected-turn (rf/subscribe [::selected-turn])]
    
    (fn []
      (if @loading?
        [:div {:class "flex justify-center items-center h-full"}
         [:div {:class "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"}]]
        
        (if @error
          [:div {:class "text-red-600 p-4"}
           [:p "Error loading embeddings: " @error]]
          
          (if (empty? @embeddings)
            [:div {:class "text-gray-600 p-4"}
             [:p "No embeddings available for this meeting"]]
            
            [:div {:class "grid grid-cols-5 gap-4 h-full bg-gray-50 rounded-lg p-4"}
             ;; Left side - Map (60% = 3 columns)
             [:div {:class "col-span-3"}
              [:div {:class "mb-4"}
               [:h3 {:class "text-lg font-medium"} "Conversation Turns"]
               [:p {:class "text-sm text-gray-600"} (str "Showing " (count @embeddings) " turns")]]
              
              [participant-legend @embeddings]
              
              [:svg {:width "100%" :height "500" :class "border border-gray-300 bg-white" :viewBox "0 0 800 500"}
               ;; Draw interactive circles for each turn
               (for [turn @embeddings]
                 (let [color (get-participant-color (:participant_name turn))
                       is-hovered (= (:turn_id turn) (:turn_id @hovered-turn))
                       is-selected (= (:turn_id turn) (:turn_id @selected-turn))
                       ;; Scale coordinates to fit new height
                       scaled-y (* (:y turn) (/ 500 600))]
                   ^{:key (:turn_id turn)}
                   [:circle {:cx (:x turn)
                            :cy scaled-y
                            :r (cond is-selected 8 is-hovered 7 :else 5)
                            :fill color
                            :stroke (cond is-selected "#000" is-hovered "#666" :else "none")
                            :stroke-width (cond is-selected 2 is-hovered 1 :else 0)
                            :style {:cursor "pointer"}
                            :on-mouse-enter #(rf/dispatch [::set-hovered-turn turn])
                            :on-mouse-leave #(rf/dispatch [::set-hovered-turn nil])
                            :on-click #(rf/dispatch [::set-selected-turn turn])}]))
               
               ;; Tooltip for hovered turn
               (when @hovered-turn
                 (let [scaled-y (* (:y @hovered-turn) (/ 500 600))]
                   [:g
                    [:rect {:x (- (:x @hovered-turn) 100)
                            :y (- scaled-y 50)
                            :width 200
                            :height 35
                            :fill "rgba(0,0,0,0.8)"
                            :rx 4}]
                    [:text {:x (:x @hovered-turn)
                            :y (- scaled-y 35)
                            :text-anchor "middle"
                            :font-size "12"
                            :fill "white"}
                     (or (:participant_name @hovered-turn) "Unknown")]
                    [:text {:x (:x @hovered-turn)
                            :y (- scaled-y 20)
                            :text-anchor "middle"
                            :font-size "10"
                            :fill "white"}
                     (let [content (:content @hovered-turn)]
                       (if (> (count content) 30)
                         (str (subs content 0 30) "...")
                         content))]]))]]
               
             ;; Right side - Detail pane (40% = 2 columns)
             [:div {:class "col-span-2"}
              [turn-detail-pane]]])))))))

(defn map-placeholder []
  (let [meeting-data (rf/subscribe [::current-meeting-data])]
    (fn []
      [:div {:class "flex flex-col items-center justify-center h-full min-h-[600px] bg-gray-50 rounded-lg"}
       [:div {:class "text-center"}
        [:svg {:class "mx-auto h-12 w-12 text-gray-400 mb-4"
               :fill "none"
               :viewBox "0 0 24 24"
               :stroke "currentColor"}
         [:path {:stroke-linecap "round"
                 :stroke-linejoin "round"
                 :stroke-width "2"
                 :d "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"}]]
        
        (if @meeting-data
          [:div
           [:h2 {:class "text-2xl font-semibold text-gray-900 mb-2"}
            (str "Semantic Map: " (:block_name @meeting-data))]
           [:p {:class "text-gray-600 mb-4"}
            "Loading visualization..."]
           [:div {:class "text-sm text-gray-500"}
            [:p (str (:turn_count @meeting-data) " turns")]
            [:p (str (:embedded_count @meeting-data) " embeddings available")]]]
          
          [:div
           [:h2 {:class "text-2xl font-semibold text-gray-900 mb-2"}
            "Select a Meeting"]
           [:p {:class "text-gray-600"}
            "Navigate to the Meetings tab and click 'See Map' on a meeting with embeddings"]])]])))

(defn semantic-map-tab []
  (let [current-meeting (rf/subscribe [::current-meeting])
        embeddings (rf/subscribe [::embeddings])]
    
    (r/create-class
     {:component-did-mount
      (fn []
        (when @current-meeting
          (rf/dispatch [::load-embeddings @current-meeting])))
      
      :component-did-update
      (fn [this [_ prev-meeting]]
        (when (and @current-meeting (not= @current-meeting prev-meeting))
          (rf/dispatch [::load-embeddings @current-meeting])))
      
      :reagent-render
      (fn []
        [:div {:class "p-4 h-full"}
         (if (and @current-meeting @embeddings)
           [semantic-map-visualization]
           [map-placeholder])])})))