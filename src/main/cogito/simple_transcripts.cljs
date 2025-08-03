(ns cogito.transcripts-tab
  (:require [re-frame.core :as rf]))

(defn transcripts-tab []
  (let [dates (rf/subscribe [:transcripts/available-dates])
        selected-date (rf/subscribe [:transcripts/selected-date])
        transcript (rf/subscribe [:transcripts/transcript-data])]
    
    ;; Load dates on mount
    (when (empty? @dates)
      (rf/dispatch [:transcripts/load-available-dates]))
    
    (fn []
      [:div.h-full.flex
       ;; Left pane - dates
       [:div.w-1-3.border-r.p-4
        [:h2 "Transcript Dates"]
        (for [date-info @dates]
          ^{:key (:date date-info)}
          [:div {:on-click #(rf/dispatch [:transcripts/select-date (:date date-info)])}
           (:date date-info) " (" (:turn_count date-info) " turns)"])]
       
       ;; Right pane - transcript
       [:div.flex-1.p-4
        (if @selected-date
          [:div
           [:h3 (str "Conversations for " @selected-date)]
           (for [turn @transcript]
             ^{:key (:id turn)}
             [:div.mb-4
              [:div.font-bold "User: " (:prompt turn)]
              [:div "Assistant: " (str (:response turn))]])]
          [:p "Select a date to view transcripts"])]]))))