(ns cogito.transcript-viewer
  (:require [re-frame.core :as rf]
            [cogito.response-renderer :as renderer]))

(defn- format-timestamp [timestamp]
  (let [date (js/Date. timestamp)]
    (.toLocaleTimeString date [] #js {:hour "2-digit" :minute "2-digit"})))

(defn- prompt-section [turn]
  [:div.mb-4
   [:div.flex.items-center.gap-2.mb-2
    [:span.text-sm.font-medium.text-gray-700 "User"]
    [:span.text-xs.text-gray-500 (format-timestamp (:created_at turn))]]
   [:div.bg-gray-50.rounded.p-3.text-sm.whitespace-pre-wrap
    (:prompt turn)]])

(defn- response-section [turn]
  [:div.mb-6
   [:div.flex.items-center.gap-2.mb-2
    [:span.text-sm.font-medium.text-blue-700 "Assistant"]
    [:span.text-xs.text-gray-500 (format-timestamp (:created_at turn))]]
   [:div.bg-blue-50.rounded.p-3.text-sm
    [renderer/render-response (:response turn)]]])

(defn- conversation-turn [turn]
  [:div.border-l-2.border-gray-200.pl-4.ml-2
   [prompt-section turn]
   [response-section turn]])

(defn- date-header [selected-date transcript-data]
  (when @selected-date
    [:div.mb-6.pb-4.border-b.border-gray-200
     [:h3.text-lg.font-semibold.text-gray-900 
      (str "Conversations for " (.toLocaleDateString (js/Date. @selected-date)))]
     (when @transcript-data
       [:p.text-sm.text-gray-500 
        (str (count @transcript-data) " conversation turns")])]))

(defn transcript-viewer []
  (let [selected-date (rf/subscribe [:transcripts/selected-date])
        transcript-data (rf/subscribe [:transcripts/transcript-data])
        loading? (rf/subscribe [:transcripts/loading-transcript?])]
    (fn []
      [:div.flex-1.p-4.overflow-y-auto
       [date-header selected-date transcript-data]
       
       (cond
         @loading?
         [:div.flex.items-center.justify-center.py-12
          [:div.flex.flex-col.items-center.gap-3
           [:div.animate-spin.rounded-full.h-8.w-8.border-b-2.border-blue-600]
           [:span.text-sm.text-gray-500 "Loading transcript..."]]]
         
         (and @selected-date @transcript-data (seq @transcript-data))
         [:div.space-y-6
          (for [turn @transcript-data]
            ^{:key (:id turn)}
            [conversation-turn turn])]
         
         @selected-date
         [:div.flex.items-center.justify-center.py-12
          [:div.text-center
           [:p.text-lg.mb-2.text-gray-600 "No conversations found"]
           [:p.text-sm.text-gray-500 "No conversation history for this date"]]]
         
         :else
         [:div.flex.items-center.justify-center.py-12
          [:div.text-center
           [:p.text-lg.mb-2.text-gray-600 "Select a date"]
           [:p.text-sm.text-gray-500 "Choose a date from the left panel to view transcripts"]])))