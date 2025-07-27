(ns cogito.workbench
  (:require [reagent.core :as r]
            [re-frame.core :as rf]
            [cogito.response-renderer :as renderer]
            [cogito.story-arc :as story-arc]
            [cogito.bot-creation :as bot-creation]
            [cogito.meetings :as meetings]
            [cogito.semantic-map-simple :as semantic-map]))

(defn prompt-input []
  (let [current-prompt (rf/subscribe [:current-prompt])
        loading? (rf/subscribe [:loading?])]
    (fn []
      [:div.prompt-input
       [:textarea
        {:value @current-prompt
         :on-change #(rf/dispatch [:set-current-prompt (-> % .-target .-value)])
         :on-key-down #(when (and (= (.-key %) "Enter") 
                                 (not (.-shiftKey %))
                                 (not @loading?))
                         (.preventDefault %)
                         (rf/dispatch [:submit-prompt @current-prompt]))
         :placeholder "Enter your prompt..."
         :disabled @loading?}]
       [:button
        {:on-click #(rf/dispatch [:submit-prompt @current-prompt])
         :disabled (or @loading? (empty? @current-prompt))}
        (if @loading? "Processing..." "Send")]])))

(defn turn-display [turn]
  [:div.turn
   [:div.turn-prompt (:prompt turn)]
   [:div.turn-response
    ;; This is where the magic happens - dynamic rendering based on response type
    ;; Pass the turn ID for response-set state management
    [renderer/render-response (assoc (:response turn) :turn-id (:id turn))]]])

(defn tab-nav []
  (let [active-tab (rf/subscribe [:workbench/active-tab])
        user (rf/subscribe [:user])
        logging-out? (rf/subscribe [:logging-out?])]
    (fn []
      [:div.tab-nav.flex.border-b.border-gray-200.mb-4.justify-between
       [:div.flex
        [:button.tab-button.px-4.py-2.border-b-2
         {:class (if (= @active-tab :conversation) "border-blue-500 text-blue-600" "border-transparent text-gray-500 hover:text-gray-700")
          :on-click #(rf/dispatch [:workbench/set-active-tab :conversation])}
         "Conversation"]
        [:button.tab-button.px-4.py-2.border-b-2
         {:class (if (= @active-tab :meetings) "border-blue-500 text-blue-600" "border-transparent text-gray-500 hover:text-gray-700")
          :on-click #(rf/dispatch [:workbench/set-active-tab :meetings])}
         "Meetings"]
        [:button.tab-button.px-4.py-2.border-b-2
         {:class (if (= @active-tab :bot-creation) "border-blue-500 text-blue-600" "border-transparent text-gray-500 hover:text-gray-700")
          :on-click #(rf/dispatch [:workbench/set-active-tab :bot-creation])}
         "Create Bot"]
        [:button.tab-button.px-4.py-2.border-b-2
         {:class (if (= @active-tab :map) "border-blue-500 text-blue-600" "border-transparent text-gray-500 hover:text-gray-700")
          :on-click #(rf/dispatch [:workbench/set-active-tab :map])}
         "Map"]
        [:button.tab-button.px-4.py-2.border-b-2
         {:class (if (= @active-tab :meeting-files) "border-blue-500 text-blue-600" "border-transparent text-gray-500 hover:text-gray-700")
          :on-click #(rf/dispatch [:workbench/set-active-tab :meeting-files])}
         "Meeting Files"]]
       [:div.flex.items-center.space-x-4
        [:span.text-sm.text-gray-600 
         (str "Logged in as " (:email @user))]
        [:button.px-3.py-1.text-sm.bg-red-500.text-white.rounded.hover:bg-red-600.disabled:opacity-50
         {:on-click #(rf/dispatch [:logout])
          :disabled @logging-out?}
         (if @logging-out? "Logging out..." "Logout")]]])))

(defn conversation-tab []
  (let [turns (rf/subscribe [:turns])
        active-meeting (rf/subscribe [:active-meeting])]
    (fn []
      [:div.conversation-tab
       (when @active-meeting
         [:div.bg-blue-50.border-b.border-blue-200.px-4.py-3.mb-4
          [:div.flex.justify-between.items-center
           [:div
            [:h2.text-lg.font-semibold.text-blue-900 
             (str "Meeting: " (or (:name @active-meeting) (:block_name @active-meeting) "Unnamed Meeting"))]
            [:p.text-sm.text-blue-700 
             (str "ID: " (or (:meeting_id @active-meeting) (:block_id @active-meeting)))]]
           [:button.px-3.py-1.text-sm.bg-blue-600.text-white.rounded.hover:bg-blue-700
            {:on-click #(rf/dispatch [:leave-meeting])}
            "Leave Meeting"]]])
       [:div.conversation-history
        (for [turn @turns]
          ^{:key (:id turn)}
          [turn-display turn])]
       [prompt-input]])))

(defn meeting-files-tab []
  [:div.meeting-files-tab.p-4
   [:h2.text-xl.font-semibold.mb-4 "Meeting Files"]
   [:p.text-gray-600 "Coming soon: Upload and manage files for meeting contexts, search across meeting documents, and file-based insights."]])

(defn panel []
  (let [active-tab (rf/subscribe [:workbench/active-tab])]
    (fn []
      [:div.workbench-panel
       [tab-nav]
       (case @active-tab
         :conversation [conversation-tab]
         :meetings [meetings/meetings-page]
         :bot-creation [bot-creation/bot-creation-tab]
         :map [semantic-map/semantic-map-tab]
         :meeting-files [meeting-files-tab]
         [conversation-tab])])))