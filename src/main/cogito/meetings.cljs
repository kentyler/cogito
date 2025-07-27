(ns cogito.meetings
  (:require [re-frame.core :as rf]
            [reagent.core :as r]))

;; Events
(rf/reg-event-fx
 ::delete-meeting
 (fn [_ [_ block-id meeting-name]]
   (when (js/confirm (str "Are you sure you want to delete the meeting '" meeting-name "'? This action cannot be undone."))
     (-> (js/fetch (str "/api/meetings/" block-id)
                   #js {:method "DELETE"
                        :credentials "same-origin"})
         (.then (fn [response]
                  (if (.-ok response)
                    (.then (.json response)
                           #(do
                              (js/alert (get (js->clj % :keywordize-keys true) :message "Meeting deleted"))
                              (rf/dispatch [::load-meetings])))
                    (.then (.json response)
                           #(js/alert (str "Error: " (get (js->clj % :keywordize-keys true) :error "Unknown error")))))))
         (.catch #(js/alert "Network error occurred"))))
   {}))

(rf/reg-event-fx
 ::load-meetings
 (fn [_ _]
   (-> (js/fetch "/api/meetings"
                 #js {:credentials "same-origin"})
       (.then #(.json %))
       (.then (fn [data]
                (rf/dispatch [::meetings-loaded (js->clj data :keywordize-keys true)])))
       (.catch (fn [error]
                 (rf/dispatch [::meetings-load-failed (str error)]))))
   {}))

(rf/reg-event-db
 ::meetings-loaded
 (fn [db [_ meetings]]
   (assoc db :meetings meetings)))

(rf/reg-event-db
 ::meetings-load-failed
 (fn [db [_ error]]
   (assoc db :meetings-error error)))

(rf/reg-event-db
 ::set-selected-meeting
 (fn [db [_ meeting-id]]
   (assoc db :selected-meeting meeting-id)))

;; Subscriptions
(rf/reg-sub
 ::meetings
 (fn [db _]
   (:meetings db)))

(rf/reg-sub
 ::meetings-error
 (fn [db _]
   (:meetings-error db)))

(rf/reg-sub
 ::selected-meeting
 (fn [db _]
   (:selected-meeting db)))

;; Helper functions
(defn format-date [date-str]
  (when date-str
    (try
      (let [date (js/Date. date-str)]
        (.toLocaleDateString date "en-US" 
                            #js {:year "numeric" 
                                 :month "short" 
                                 :day "numeric"}))
      (catch js/Error e
        date-str))))

(defn simple-meeting-item [meeting]
  [:div {:class "bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow duration-200"}
   [:div {:class "flex justify-between items-center"}
    [:div {:class "flex-1"}
     [:h3 {:class "text-lg font-medium text-gray-900"}
      (or (:block_name meeting) "Unnamed Meeting")]
     [:p {:class "text-sm text-gray-500 mt-1"}
      (format-date (:created_at meeting))]
     [:p {:class "text-sm text-gray-600 mt-1"}
      (str (or (:turn_count meeting) 0) " turns, " 
           (or (:participant_count meeting) 0) " participants")]]
    
    [:div {:class "flex gap-2"}
     [:button {:class "px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors duration-200"
               :on-click #(do
                            (rf/dispatch [:join-meeting meeting])
                            (rf/dispatch [:workbench/set-active-tab :conversation]))}
      "Join"]
     
     [:button {:class "px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200"
               :on-click #(rf/dispatch [::set-selected-meeting (:block_id meeting)])}
      "View"]
     
     (when (and (:embedded_count meeting) (> (:embedded_count meeting) 0))
       [:button {:class "px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200"
                 :on-click #(do
                             (rf/dispatch [:cogito.semantic-map-simple/set-current-meeting (:block_id meeting)])
                             (rf/dispatch [:workbench/set-active-tab :map]))}
        "See Map"])
     
     [:button {:class "px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors duration-200"
               :on-click #(rf/dispatch [::delete-meeting (:block_id meeting) (or (:block_name meeting) "Unnamed Meeting")])}
      "Delete"]]]])

(defn meetings-list []
  (let [meetings (rf/subscribe [::meetings])
        error (rf/subscribe [::meetings-error])]
    
    (r/create-class
     {:component-did-mount
      (fn []
        (rf/dispatch [::load-meetings]))
      
      :reagent-render
      (fn []
        [:div {:class "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}
         
         ;; Header
         [:div {:class "mb-8"}
          [:div {:class "flex justify-between items-center"}
           [:div
            [:h1 {:class "text-3xl font-bold text-gray-900"} "Meetings"]
            [:p {:class "text-gray-600 mt-2"} 
             "Browse and analyze your conversation data"]]
           [:button {:class "px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                     :on-click #(let [meeting-name (js/prompt "Enter meeting name:")]
                                  (when meeting-name
                                    (rf/dispatch [:create-new-meeting meeting-name])))}
            "New Meeting"]]]
         
         ;; Error state
         (when @error
           [:div {:class "bg-red-50 border border-red-200 rounded-md p-4 mb-6"}
            [:div {:class "flex"}
             [:div {:class "ml-3"}
              [:h3 {:class "text-sm font-medium text-red-800"} "Error loading meetings"]
              [:div {:class "mt-2 text-sm text-red-700"}
               [:p (str @error)]]]]])
         
         ;; Loading state
         (when (and (nil? @meetings) (nil? @error))
           [:div {:class "flex justify-center items-center py-12"}
            [:div {:class "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"}]])
         
         ;; Simple meetings list
         (when @meetings
           (if (seq @meetings)
             [:div {:class "space-y-4"}
              (for [meeting @meetings]
                ^{:key (:block_id meeting)}
                [simple-meeting-item meeting])]
             
             [:div {:class "text-center py-12"}
              [:div {:class "text-gray-500"}
               [:p {:class "text-lg"} "No meetings found"]
               [:p {:class "text-sm mt-2"} "Create a new meeting bot to get started"]]]))])})))

(defn meeting-detail [meeting-id]
  (let [meetings (rf/subscribe [::meetings])
        meeting (when @meetings 
                  (first (filter #(= (:block_id %) meeting-id) @meetings)))]
    (fn []
      (if meeting
        [:div {:class "bg-white rounded-lg shadow-md p-6"}
         [:div {:class "mb-4"}
          [:button {:class "text-blue-600 hover:text-blue-800 mb-4"
                    :on-click #(rf/dispatch [::set-selected-meeting nil])}
           "← Back to list"]
          [:h2 {:class "text-2xl font-bold text-gray-900"}
           (:block_name meeting)]
          [:p {:class "text-sm text-gray-500 mt-1"}
           (format-date (:created_at meeting))]]
         
         [:div {:class "grid grid-cols-2 gap-4 mb-6"}
          [:div {:class "bg-gray-50 p-4 rounded"}
           [:p {:class "text-sm text-gray-600"} "Total Turns"]
           [:p {:class "text-2xl font-semibold"} (:turn_count meeting)]]
          [:div {:class "bg-gray-50 p-4 rounded"}
           [:p {:class "text-sm text-gray-600"} "Participants"]
           [:p {:class "text-2xl font-semibold"} (:participant_count meeting)]]
          [:div {:class "bg-gray-50 p-4 rounded"}
           [:p {:class "text-sm text-gray-600"} "Embeddings"]
           [:p {:class "text-2xl font-semibold"} (:embedded_count meeting)]]
          [:div {:class "bg-gray-50 p-4 rounded"}
           [:p {:class "text-sm text-gray-600"} "Status"]
           [:p {:class "text-lg font-semibold"} (or (:status meeting) "Unknown")]]]
         
         (when (:meeting_url meeting)
           [:div {:class "mb-4"}
            [:p {:class "text-sm text-gray-600"} "Meeting URL"]
            [:p {:class "text-sm font-mono bg-gray-100 p-2 rounded"} (:meeting_url meeting)]])
         
         (when (> (:embedded_count meeting) 0)
           [:button {:class "mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                     :on-click #(do
                                  (rf/dispatch [:cogito.semantic-map-simple/set-current-meeting (:block_id meeting)])
                                  (rf/dispatch [:workbench/set-active-tab :map]))}
            "View Semantic Map"])]
        
        [:div "Meeting not found"]))))

(defn meetings-page []
  (let [selected-meeting (rf/subscribe [::selected-meeting])]
    (fn []
      (if @selected-meeting
        [meeting-detail @selected-meeting]
        [meetings-list]))))