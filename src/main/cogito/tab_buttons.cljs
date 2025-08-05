(ns cogito.tab-buttons
  (:require [re-frame.core :as rf]))

(defn tab-button [active-tab tab-key label]
  [:button.tab-button.px-4.py-2.border-b-2
   {:class (if (= @active-tab tab-key) 
             "border-blue-500 text-blue-600" 
             "border-transparent text-gray-500 hover:text-gray-700")
    :on-click #(rf/dispatch [:workbench/set-active-tab tab-key])}
   label])

(defn tab-buttons-section []
  (let [active-tab (rf/subscribe [:workbench/active-tab])]
    (fn []
      [:div.flex
       [tab-button active-tab :conversation "Conversation"]
       [tab-button active-tab :meetings "Meetings"]
       [tab-button active-tab :bot-creation "Create Bot"]
       [tab-button active-tab :map "Map"]
       [tab-button active-tab :upload-files "Upload Files"]
       [tab-button active-tab :daily-summary "Daily Summary"]
       [tab-button active-tab :monthly-summary "Monthly Summary"]
       [tab-button active-tab :transcripts "Transcripts"]
       [tab-button active-tab :invitations "Invitations"]])))