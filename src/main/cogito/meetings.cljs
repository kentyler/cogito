(ns cogito.meetings
  (:require [re-frame.core :as rf]
            [reagent.core :as r]))

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

(rf/reg-event-fx
 ::load-transcript
 (fn [_ [_ meeting-id]]
   (-> (js/fetch (str "/api/admin/meetings/" meeting-id "/transcript")
                 #js {:credentials "same-origin"})
       (.then #(.json %))
       (.then (fn [data]
                (rf/dispatch [::transcript-loaded meeting-id (js->clj data :keywordize-keys true)])))
       (.catch (fn [error]
                 (rf/dispatch [::transcript-load-failed (str error)]))))
   {}))

(rf/reg-event-db
 ::transcript-loaded
 (fn [db [_ meeting-id transcript-data]]
   (assoc-in db [:transcripts meeting-id] transcript-data)))

(rf/reg-event-db
 ::transcript-load-failed
 (fn [db [_ error]]
   (assoc db :transcript-error error)))

(rf/reg-event-db
 ::set-transcript-view
 (fn [db [_ meeting-id]]
   (.log js/console "🔍 Setting transcript view for meeting:" meeting-id)
   (assoc db :transcript-view meeting-id)))

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

(rf/reg-sub
 ::transcript
 (fn [db [_ meeting-id]]
   (get-in db [:transcripts meeting-id])))

(rf/reg-sub
 ::transcript-error
 (fn [db _]
   (:transcript-error db)))

(rf/reg-sub
 ::transcript-view
 (fn [db _]
   (:transcript-view db)))

(defn transcript-panel [meeting-id]
  (let [transcript-data (rf/subscribe [::transcript meeting-id])
        error (rf/subscribe [::transcript-error])]
    (.log js/console "📋 transcript-panel called for meeting:" meeting-id)
    (.log js/console "📋 transcript-data:" @transcript-data)
    (.log js/console "📋 error:" @error)
    
    (r/create-class
     {:component-did-mount
      (fn []
        (.log js/console "📋 transcript-panel mounting, dispatching load-transcript for:" meeting-id)
        (rf/dispatch [::load-transcript meeting-id]))
      
      :reagent-render
      (fn []
        [:div {:class "h-full flex flex-col"}
         [:div {:class "border-b pb-4 mb-4"}
          [:div {:class "flex justify-between items-center"}
           [:h2 {:class "text-xl font-semibold text-gray-900"} "Meeting Transcript"]
           [:button {:class "px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                     :on-click #(rf/dispatch [::set-transcript-view nil])}
            "Close"]]]
         
         ;; Content area
         [:div {:class "flex-1 overflow-y-auto"}
          (cond
            @error
            [:div {:class "bg-red-50 border border-red-200 rounded-md p-4"}
             [:p {:class "text-red-700"} (str "Error loading transcript: " @error)]]
            
            (nil? @transcript-data)
            [:div {:class "flex justify-center items-center h-full"}
             [:div {:class "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"}]]
            
            (nil? (:full_transcript @transcript-data))
            [:div {:class "text-center text-gray-500 py-8"}
             [:p "No transcript available for this meeting."]]
            
            :else
            [:div {:class "bg-gray-50 p-4 rounded-lg"}
             [:div {:class "mb-4"}
              [:h3 {:class "font-semibold text-lg"} (:name @transcript-data)]
              [:p {:class "text-sm text-gray-600 mt-1"}
               (str "Created: " (format-date (:created_at @transcript-data)))]]
             [:div {:class "bg-white p-4 rounded border"}
              [:pre {:class "whitespace-pre-wrap text-sm"}
               (if (string? (:full_transcript @transcript-data))
                 (:full_transcript @transcript-data)
                 (js/JSON.stringify (:full_transcript @transcript-data) nil 2))]]])]])})))

(defn meeting-conversation-panel [meeting-id meetings]
  (let [meeting (first (filter #(= (:block_id %) meeting-id) meetings))
        turns (rf/subscribe [:turns])
        current-prompt (rf/subscribe [:current-prompt])
        loading? (rf/subscribe [:loading?])]
    
    [:div {:class "h-full flex flex-col"}
     ;; Header with meeting title
     [:div {:class "border-b pb-4 mb-4"}
      [:h2 {:class "text-xl font-semibold text-gray-900"}
       (or (:block_name meeting) "Unnamed Meeting")]
      [:p {:class "text-sm text-gray-500 mt-1"}
       (str "Meeting conversation • " (format-date (:created_at meeting)))]]
     
     ;; Conversation history - scrollable list with all turns
     [:div {:class "flex-1 overflow-y-auto mb-4 space-y-6 min-h-0"}
      (if (seq @turns)
        ;; Show all turns in chronological order (oldest first, newest at bottom)
        (for [turn @turns]
          ^{:key (:id turn)}
          [:div {:class "space-y-3"}
           ;; User prompt
           [:div {:class "flex justify-end"}
            [:div {:class "max-w-xs lg:max-w-md px-4 py-2 bg-blue-600 text-white rounded-lg"}
             [:div {:class "text-sm font-medium mb-1"} "You"]
             [:div (:prompt turn)]]]
           ;; Assistant response
           [:div {:class "flex justify-start"}
            [:div {:class "max-w-xs lg:max-w-md px-4 py-2 bg-gray-100 text-gray-900 rounded-lg"}
             [:div {:class "text-sm font-medium mb-1"} "Assistant"]
             [:div (if (map? (:response turn))
                     ;; Handle complex response types
                     (case (:response-type (:response turn))
                       :text (:content (:response turn))
                       :response-set (str "Response with " (count (:alternatives (:response turn))) " alternatives")
                       (str (:response turn)))
                     ;; Simple string response
                     (str (:response turn)))]]]])
        [:div {:class "flex items-center justify-center h-full text-gray-500"}
         [:div {:class "text-center"}
          [:p "No conversation yet."]
          [:p {:class "text-sm mt-1"} "Start typing below to add to this meeting's context."]]])]
     
     ;; Input area
     [:div {:class "border-t pt-4"}
      [:textarea {:class "w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :rows 3
                  :placeholder (str "Continue conversation for \"" (or (:block_name meeting) "this meeting") "\"...")
                  :value @current-prompt
                  :on-change #(rf/dispatch [:set-current-prompt (-> % .-target .-value)])
                  :disabled @loading?}]
      [:div {:class "flex justify-between items-center mt-2"}
       [:div {:class "text-xs text-gray-500"}
        "Messages will be tagged with this meeting"]
       [:button {:class "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 :disabled (or @loading? (empty? @current-prompt))
                 :on-click #(rf/dispatch [:submit-meeting-prompt @current-prompt meeting-id])}
        (if @loading? "Sending..." "Send")]]]]))

(defn simple-meeting-item [meeting selected?]
  [:div {:class (str "bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer "
                     (when selected? "border-blue-500 bg-blue-50"))}
   [:div {:class "flex justify-between items-start"}
    [:div {:class "flex-1"
           :on-click #(rf/dispatch [::set-selected-meeting (:block_id meeting)])}
     [:h3 {:class (str "text-lg font-medium " (if selected? "text-blue-900" "text-gray-900"))}
      (or (:block_name meeting) "Unnamed Meeting")]
     [:p {:class "text-sm text-gray-500 mt-1"}
      (str (format-date (:created_at meeting)) 
           (when (:created_by_email meeting) 
             (str " - " (:created_by_email meeting))))]
     [:p {:class "text-sm text-gray-600 mt-1"}
      (str (or (:turn_count meeting) 0) " turns, " 
           (or (:participant_count meeting) 0) " participants")]
     
     ;; Add transcript summary if available
     (when (:transcript_summary meeting)
       [:p {:class "text-sm text-gray-700 mt-2 italic bg-gray-50 p-2 rounded"}
        (:transcript_summary meeting)])]
    
    [:div {:class "flex gap-2"}
     [:button {:class "px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors duration-200"
               :on-click #(do
                            (rf/dispatch [:join-meeting meeting])
                            (rf/dispatch [:workbench/set-active-tab :conversation]))}
      "Join"]
     
     [:button {:class "px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200"
               :on-click #(rf/dispatch [::set-selected-meeting (:block_id meeting)])}
      "View"]
     
     [:button {:class "px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors duration-200"
               :on-click #(rf/dispatch [::set-transcript-view (:block_id meeting)])}
      "Transcript"]
     
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
        error (rf/subscribe [::meetings-error])
        selected-meeting (rf/subscribe [::selected-meeting])]
    
    (r/create-class
     {:component-did-mount
      (fn []
        (rf/dispatch [::load-meetings]))
      
      :reagent-render
      (fn []
        [:div {:class "flex h-full gap-4"}
         
         ;; Left panel - Meetings list
         [:div {:class "w-1/3 overflow-y-auto pr-4"}
          [:div {:class "mb-4"}
           [:div {:class "flex justify-between items-center"}
            [:h1 {:class "text-2xl font-bold text-gray-900"} "Meetings"]
            [:button {:class "px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200"
                      :on-click #(let [meeting-name (js/prompt "Enter meeting name:")]
                                   (when meeting-name
                                     (rf/dispatch [:create-new-meeting meeting-name])))}
             "New"]]]
          
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
          
          ;; Meetings list
          (when @meetings
            (if (seq @meetings)
              [:div {:class "space-y-2"}
               (for [meeting @meetings]
                 ^{:key (:block_id meeting)}
                 [simple-meeting-item meeting (= (:block_id meeting) @selected-meeting)])]
              
              [:div {:class "text-center py-12"}
               [:div {:class "text-gray-500"}
                [:p {:class "text-lg"} "No meetings found"]
                [:p {:class "text-sm mt-2"} "Create a new meeting bot to get started"]]]))
         ] ;; End of left panel
         
         ;; Right panel - Conversation or Transcript
         [:div {:class "flex-1 border-l pl-4"}
          (let [transcript-view @(rf/subscribe [::transcript-view])]
            (.log js/console "🔍 Right panel - transcript-view:" transcript-view "selected-meeting:" @selected-meeting)
            (cond
              transcript-view
              (do
                (.log js/console "📄 Rendering transcript panel for meeting:" transcript-view)
                [transcript-panel transcript-view])
              
              @selected-meeting
              (do
                (.log js/console "💬 Rendering conversation panel for meeting:" @selected-meeting)
                [meeting-conversation-panel @selected-meeting @meetings])
              
              :else
              [:div {:class "flex items-center justify-center h-full text-gray-500"}
               [:p "Select a meeting to continue the conversation"]]))]])})))

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
  [meetings-list])