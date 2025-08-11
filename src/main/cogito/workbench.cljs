(ns cogito.workbench
  (:require [reagent.core :as r]
            [re-frame.core :as rf]
            [cogito.response-renderer :as renderer]
            [cogito.story-arc :as story-arc]
            [cogito.bot-creation :as bot-creation]
            [cogito.meetings :as meetings]
            [cogito.daily-summary :as daily-summary]
            [cogito.monthly-summary :as monthly-summary]
            [cogito.upload-files-left-pane :as upload-left]
            [cogito.upload-files-right-pane :as upload-right]
            [cogito.invitations :as invitations]
            [cogito.tab-buttons :as tab-buttons]
            [cogito.client-selector :as client-selector]
            [cogito.logout-button :as logout-button]))

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
    ;; Pass the turn ID for response-set state management and sources for references
    [renderer/render-response (assoc (:response turn) 
                                     :turn-id (:id turn)
                                     :sources (:sources turn))]]])


(defn header []
  (let [user (rf/subscribe [:user])
        available-clients (rf/subscribe [:available-clients])]
    
    ;; Fetch available clients on component mount if we don't have them
    (when (and @user (empty? @available-clients))
      (rf/dispatch [:fetch-available-clients]))
    
    (fn []
      [:div.prompt-input {:style {:display "flex"
                                  :justify-content "space-between"
                                  :align-items "center"}}
       ;; Left side - Cogito: Client Name
       [:h1 {:style {:font-size "1.25em" 
                     :margin "0" 
                     :color "#333"
                     :font-weight "600"}}
        "Cogito"]
       
       ;; Right side - User info and logout
       [:div {:style {:display "flex" 
                      :align-items "center" 
                      :gap "16px"}}
        [client-selector/client-selector]
        [:button {:on-click #(rf/dispatch [:logout])}
         "Logout"]]])))

(defn tab-nav []
  (fn []
    [:div.tab-nav.border-b.border-gray-200.mb-4.px-6
     [tab-buttons/tab-buttons-section]]))

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

(defn upload-files-tab []
  (let [uploaded-files (rf/subscribe [:upload-files/files])]
    ;; Load files on mount
    (when (empty? @uploaded-files)
      (rf/dispatch [:upload-files/load-files]))
    (fn []
      [:table.upload-files-tab.h-full.w-full
       [:tr
        [:td {:style {:width "33%" :vertical-align "top"} :class "border-r border-gray-200 p-4"}
         [upload-left/upload-files-left-pane]]
        [:td {:style {:width "67%" :vertical-align "top"} :class "p-4"}
         [upload-right/upload-files-right-pane]]]])))

(defn panel []
  (let [active-tab (rf/subscribe [:workbench/active-tab])]
    (fn []
      [:div.workbench-panel.h-screen.flex.flex-col
       ;; Header with Cogito branding and user info
       [header]
       
       ;; Navigation tabs
       [tab-nav]
       
       ;; Main content area
       [:div.flex-1.overflow-hidden
        (case @active-tab
          :conversation [conversation-tab]
          :meetings [meetings/meetings-page]
          :bot-creation [bot-creation/bot-creation-tab]
          :upload-files [upload-files-tab]
          :daily-summary [daily-summary/daily-summary-tab]
          :monthly-summary [monthly-summary/monthly-summary-tab]
          :invitations [invitations/invitations-panel]
          [conversation-tab])]])))