(ns cogito.transcript-date-selector
  (:require [re-frame.core :as rf]))

(defn- format-date [date-str]
  (.toLocaleDateString (js/Date. date-str)))

(defn- format-date-with-count [date turn-count]
  (str (format-date date) " (" turn-count " turns)"))

(defn- is-selected-date? [date selected-date]
  (= date @selected-date))

(defn- date-item-classes [date selected-date]
  (str "p-3 rounded cursor-pointer border transition-colors "
       (if (is-selected-date? date selected-date)
         "bg-blue-50 border-blue-200 text-blue-800"
         "border-transparent hover:bg-gray-50")))

(defn- date-item [date-info selected-date]
  (let [date (:date date-info)
        turn-count (:turn_count date-info)]
    [:div {:class (date-item-classes date selected-date)
           :on-click #(rf/dispatch [:transcripts/select-date date])}
     [:div.flex.justify-between.items-center
      [:span.font-medium (format-date date)]
      [:span.text-sm.text-gray-500 (str turn-count " turns")]]]))

(defn transcript-date-selector []
  (let [available-dates (rf/subscribe [:transcripts/available-dates])
        selected-date (rf/subscribe [:transcripts/selected-date])
        loading? (rf/subscribe [:transcripts/loading-dates?])]
    
    ;; Load available dates on mount
    (when (empty? @available-dates)
      (rf/dispatch [:transcripts/load-available-dates]))
    
    (fn []
      [:div {:class "w-1/3 border-r border-gray-200 p-4 flex flex-col"}
       [:div.mb-4
        [:h2.text-xl.font-semibold.mb-2 "Transcript Dates"]
        [:p.text-sm.text-gray-600.mb-4 "Select a date to view conversation transcripts"]]
       
       [:div.flex-1.overflow-y-auto
        (if @loading?
          [:div.flex.items-center.justify-center.py-8
           [:div.animate-spin.rounded-full.h-6.w-6.border-b-2.border-blue-600]]
          
          (if (and @available-dates (seq @available-dates))
            [:div.space-y-2
             (for [date-info @available-dates]
               ^{:key (:date date-info)}
               [date-item date-info selected-date])]
            
            [:p.text-sm.text-gray-500.text-center.py-8 
             "No conversation history found"])))