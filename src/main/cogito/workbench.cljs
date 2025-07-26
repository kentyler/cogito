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
         {:class (if (= @active-tab :story-arc) "border-blue-500 text-blue-600" "border-transparent text-gray-500 hover:text-gray-700")
          :on-click #(rf/dispatch [:workbench/set-active-tab :story-arc])}
         "Story Arc"]
        [:button.tab-button.px-4.py-2.border-b-2
         {:class (if (= @active-tab :analysis) "border-blue-500 text-blue-600" "border-transparent text-gray-500 hover:text-gray-700")
          :on-click #(rf/dispatch [:workbench/set-active-tab :analysis])}
         "Analysis"]
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
         "Map"]]
       [:div.flex.items-center.space-x-4
        [:span.text-sm.text-gray-600 
         (str "Logged in as " (:email @user))]
        [:button.px-3.py-1.text-sm.bg-red-500.text-white.rounded.hover:bg-red-600.disabled:opacity-50
         {:on-click #(rf/dispatch [:logout])
          :disabled @logging-out?}
         (if @logging-out? "Logging out..." "Logout")]]])))

(defn conversation-tab []
  (let [turns (rf/subscribe [:turns])]
    (fn []
      [:div.conversation-tab
       [:div.conversation-history
        (for [turn @turns]
          ^{:key (:id turn)}
          [turn-display turn])]
       [prompt-input]])))

(defn analysis-tab []
  [:div.analysis-tab.p-4
   [:h2.text-xl.font-semibold.mb-4 "Similarity Analysis"]
   [:p.text-gray-600 "Coming soon: Real-time similarity analysis, turn comparisons, and conversation insights."]])

(defn panel []
  (let [active-tab (rf/subscribe [:workbench/active-tab])]
    (fn []
      [:div.workbench-panel
       [tab-nav]
       (case @active-tab
         :conversation [conversation-tab]
         :story-arc [story-arc/mount-component]
         :analysis [analysis-tab]
         :meetings [meetings/meetings-page]
         :bot-creation [bot-creation/bot-creation-tab]
         :map [semantic-map/semantic-map-tab]
         [conversation-tab])])))