(ns cogito.semantic-map-simple
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
   (-> (js/fetch (str "/api/meetings/" block-id "/embeddings"))
       (.then #(.json %))
       (.then (fn [data]
                (rf/dispatch [::embeddings-loaded (js->clj data :keywordize-keys true)])))
       (.catch (fn [error]
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

;; Subscriptions
(rf/reg-sub
 ::current-meeting
 (fn [db _]
   (:map/current-meeting db)))

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

;; Helper functions
(defn get-participant-color [participant-name]
  (let [colors ["#3B82F6" "#10B981" "#F59E0B" "#EF4444" "#8B5CF6" "#EC4899" "#06B6D4" "#84CC16"]
        hash (reduce + 0 (map int (or participant-name "Unknown")))]
    (nth colors (mod hash (count colors)))))

;; Components
(defn simple-map-view []
  (let [embeddings (rf/subscribe [::embeddings])
        selected-turn (rf/subscribe [::selected-turn])]
    [:div {:style {:display "flex" :height "600px" :background "#f9fafb" :border-radius "8px"}}
     
     ;; Left side - 60%
     [:div {:style {:width "60%" :padding "16px"}}
      [:h3 "Conversation Map"]
      [:p (str "Showing " (count @embeddings) " turns")]
      
      [:svg {:width "100%" :height "400" :style {:border "1px solid #ccc" :background "white"}}
       (for [turn @embeddings]
         ^{:key (:turn_id turn)}
         [:circle {:cx (:x turn)
                  :cy (* (:y turn) 0.8)
                  :r 5
                  :fill (get-participant-color (:participant_name turn))
                  :style {:cursor "pointer"}
                  :on-click #(rf/dispatch [::set-selected-turn turn])}])]]
     
     ;; Right side - 40%
     [:div {:style {:width "40%" :padding "16px" :border-left "1px solid #ccc"}}
      (if @selected-turn
        [:div
         [:h4 "Turn Details"]
         [:p [:strong "Participant: "] (:participant_name @selected-turn)]
         [:p [:strong "Content: "] (:content @selected-turn)]]
        [:p "Click a dot to see details"])]]))

(defn semantic-map-tab []
  (let [current-meeting (rf/subscribe [::current-meeting])
        embeddings (rf/subscribe [::embeddings])]
    
    (r/create-class
     {:component-did-mount
      (fn []
        (when @current-meeting
          (rf/dispatch [::load-embeddings @current-meeting])))
      
      :reagent-render
      (fn []
        [:div {:style {:padding "16px"}}
         (if @embeddings
           [simple-map-view]
           [:p "Loading..."])])})))