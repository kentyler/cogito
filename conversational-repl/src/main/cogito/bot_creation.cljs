(ns cogito.bot-creation
  (:require [reagent.core :as r]
            [re-frame.core :as rf]
            [ajax.core :as ajax]))

(defn bot-creation-form []
  (let [form-data (r/atom {:meeting-url "" :meeting-name ""})
        loading? (rf/subscribe [:bot-creation/loading?])
        message (rf/subscribe [:bot-creation/message])
        user-email (rf/subscribe [:user-email])]
    (fn []
      [:div.bot-creation-tab.p-6.max-w-2xl.mx-auto
       [:h2.text-2xl.font-bold.mb-6 "Create Recall Bot"]
       
       (when @message
         [:div.message-display.p-4.mb-4.rounded
          {:class (if (= (:type @message) :error)
                    "bg-red-100 text-red-700"
                    "bg-green-100 text-green-700")}
          (:text @message)])
       
       [:form.space-y-4
        {:on-submit (fn [e]
                      (.preventDefault e)
                      (rf/dispatch [:bot-creation/create-bot @form-data]))}
        
        [:div.form-group
         [:label.block.text-sm.font-medium.text-gray-700.mb-1
          {:for "meeting-url"} 
          "Meeting URL"]
         [:input.w-full.px-3.py-2.border.border-gray-300.rounded-md.focus:outline-none.focus:ring-2.focus:ring-blue-500
          {:type "text"
           :id "meeting-url"
           :value (:meeting-url @form-data)
           :on-change #(swap! form-data assoc :meeting-url (-> % .-target .-value))
           :placeholder "Enter the meeting URL"
           :required true
           :disabled @loading?}]]
        
        [:div.form-group
         [:label.block.text-sm.font-medium.text-gray-700.mb-1
          {:for "meeting-name"} 
          "Meeting Name (optional)"]
         [:input.w-full.px-3.py-2.border.border-gray-300.rounded-md.focus:outline-none.focus:ring-2.focus:ring-blue-500
          {:type "text"
           :id "meeting-name"
           :value (:meeting-name @form-data)
           :on-change #(swap! form-data assoc :meeting-name (-> % .-target .-value))
           :placeholder "Enter a name for this meeting"
           :disabled @loading?}]]
        
        (when @user-email
          [:div.info-box.p-3.bg-blue-50.rounded-md
           [:p.text-sm.text-gray-700
            "Transcript will be sent to: "
            [:span.font-medium @user-email]]])
        
        [:button.w-full.px-4.py-2.bg-blue-600.text-white.rounded-md.hover:bg-blue-700.focus:outline-none.focus:ring-2.focus:ring-blue-500.disabled:opacity-50.disabled:cursor-not-allowed
         {:type "submit"
          :disabled (or @loading? (empty? (:meeting-url @form-data)))}
         (if @loading? "Creating Bot..." "Create Bot")]]])))

(defn bot-list []
  (let [bots (rf/subscribe [:bot-creation/bots])]
    (fn []
      (when (seq @bots)
        [:div.bot-list.mt-8
         [:h3.text-lg.font-semibold.mb-4 "Recently Created Bots"]
         [:div.space-y-2
          (for [bot @bots]
            ^{:key (:id bot)}
            [:div.bot-item.p-4.border.border-gray-200.rounded-md
             [:div.font-medium (:meeting_name bot "Unnamed Meeting")]
             [:div.text-sm.text-gray-600 (:meeting_url bot)]
             [:div.text-xs.text-gray-500 
              "Created: " (-> bot :created_at js/Date. .toLocaleString)]])]]))))

(defn running-bots-list []
  (let [running-bots (rf/subscribe [:bot-creation/running-bots])
        fetching? (rf/subscribe [:bot-creation/fetching-bots?])
        shutting-down (rf/subscribe [:bot-creation/shutting-down])]
    (fn []
      [:div.running-bots.mt-8
       [:div.flex.items-center.justify-between.mb-4
        [:h3.text-lg.font-semibold "Running Bots"]
        [:button.px-3.py-1.text-sm.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50
         {:on-click #(rf/dispatch [:bot-creation/fetch-bots])
          :disabled @fetching?}
         (if @fetching? "Refreshing..." "Refresh")]]
       
       (cond
         @fetching?
         [:div.p-4.text-center.text-gray-500 "Loading bots..."]
         
         (empty? @running-bots)
         [:div.p-4.text-center.text-gray-500 "No bots currently running"]
         
         :else
         [:div.space-y-3
          (for [bot @running-bots]
            ^{:key (:id bot)}
            [:div.bot-item.p-4.border.border-gray-200.rounded-md.bg-white.shadow-sm
             [:div.flex.items-start.justify-between
              [:div.flex-1
               [:div.font-medium.text-gray-900 
                (or (:meeting_name bot) "Unnamed Meeting")]
               [:div.text-sm.text-gray-600.mt-1 (:meeting_url bot)]
               [:div.text-xs.text-gray-500.mt-2
                "Bot ID: " (:id bot)]
               (when (:status bot)
                 [:div.text-xs.mt-1
                  [:span.inline-flex.px-2.py-1.text-xs.font-semibold.rounded-full
                   {:class (case (:status bot)
                             "active" "bg-green-100 text-green-800"
                             "joining" "bg-yellow-100 text-yellow-800"
                             "leaving" "bg-orange-100 text-orange-800"
                             "bg-gray-100 text-gray-800")}
                   (:status bot)]])]
              [:button.px-3.py-1.text-sm.bg-red-500.hover:bg-red-600.text-white.rounded.disabled:opacity-50.disabled:cursor-not-allowed
               {:on-click #(rf/dispatch [:bot-creation/shutdown-bot (:id bot)])
                :disabled (get @shutting-down (:id bot) false)}
               (if (get @shutting-down (:id bot))
                 "Shutting down..."
                 "Shutdown")]]])])]))) 

(defn stuck-meetings-list []
  (let [stuck-meetings (rf/subscribe [:stuck-meetings/meetings])
        fetching? (rf/subscribe [:stuck-meetings/fetching?])
        completing (rf/subscribe [:stuck-meetings/completing])]
    (fn []
      [:div.stuck-meetings.mt-8
       [:div.flex.items-center.justify-between.mb-4
        [:h3.text-lg.font-semibold.text-orange-700 "Stuck Meetings"]
        [:button.px-3.py-1.text-sm.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50
         {:on-click #(rf/dispatch [:stuck-meetings/fetch])
          :disabled @fetching?}
         (if @fetching? "Refreshing..." "Refresh")]]
       
       (cond
         @fetching?
         [:div.p-4.text-center.text-gray-500 "Loading stuck meetings..."]
         
         (empty? @stuck-meetings)
         [:div.p-4.text-center.text-gray-500 "No stuck meetings found"]
         
         :else
         [:div.space-y-3
          (for [meeting @stuck-meetings]
            ^{:key (:meeting_id meeting)}
            [:div.meeting-item.p-4.border.border-orange-200.rounded-md.bg-orange-50.shadow-sm
             [:div.flex.items-start.justify-between
              [:div.flex-1
               [:div.font-medium.text-gray-900 
                (or (:meeting_name meeting) "Unnamed Meeting")]
               [:div.text-sm.text-gray-600.mt-1 (:meeting_url meeting)]
               [:div.text-xs.text-gray-500.mt-2
                "Meeting ID: " (:meeting_id meeting)]
               [:div.text-xs.text-gray-500.mt-1
                "Bot ID: " (or (:bot_id meeting) "N/A")]
               [:div.text-xs.text-gray-500.mt-1
                "Turn Count: " (:turn_count meeting)]
               [:div.text-xs.text-gray-500.mt-1
                "Stuck since: " (-> meeting :created_at js/Date. .toLocaleString)]
               [:div.text-xs.mt-2
                [:span.inline-flex.px-2.py-1.text-xs.font-semibold.rounded-full.bg-orange-100.text-orange-800
                 "Stuck in joining"]]]
              [:button.px-3.py-1.text-sm.bg-orange-500.hover:bg-orange-600.text-white.rounded.disabled:opacity-50.disabled:cursor-not-allowed
               {:on-click #(rf/dispatch [:stuck-meetings/force-complete (:meeting_id meeting)])
                :disabled (get @completing (:meeting_id meeting) false)}
               (if (get @completing (:meeting_id meeting))
                 "Completing..."
                 "Force Complete")]]])])]))) 

(defn bot-creation-tab []
  (rf/dispatch [:bot-creation/fetch-bots])
  (rf/dispatch [:stuck-meetings/fetch])
  [:div.bot-creation-container
   [bot-creation-form]
   [running-bots-list]
   [stuck-meetings-list]
   [bot-list]])