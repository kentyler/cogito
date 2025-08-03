(ns cogito.daily-summary
  (:require [reagent.core :as r]
            [re-frame.core :as rf]
            [clojure.string :as str]))

(defn format-date [date-str]
  "Format date for display"
  (if date-str
    (try
      (.toLocaleDateString (js/Date. date-str) "en-US" 
                          #js {:weekday "long" 
                               :year "numeric" 
                               :month "long" 
                               :day "numeric"})
      (catch js/Error _
        date-str))
    "Unknown Date"))

(defn generate-year-options []
  "Generate year options from 2020 to current + 1"
  (let [current-year (.getFullYear (js/Date.))
        start-year 2020]
    (for [year (range start-year (inc (inc current-year)))]
      year)))

(defn month-names []
  ["January" "February" "March" "April" "May" "June"
   "July" "August" "September" "October" "November" "December"])

(defn get-month-year-options []
  "Generate month/year options for the past 12 months"
  (let [today (js/Date.)
        current-year (.getFullYear today)
        current-month (.getMonth today)]
    (for [i (range 12)]
      (let [target-date (js/Date. current-year (- current-month i) 1)
            year (.getFullYear target-date)
            month (.getMonth target-date)
            month-name (.toLocaleDateString target-date "en-US" #js {:month "long"})]
        {:value (str year "-" month)
         :label (str month-name " " year)
         :year year
         :month month}))))

(defn daily-summary-tab []
  (let [monthly-summaries (rf/subscribe [:daily-summary/monthly-summaries])
        monthly-generating? (rf/subscribe [:daily-summary/monthly-summaries-generating?])
        selected-period (r/atom (str (.getFullYear (js/Date.)) "-" (.getMonth (js/Date.))))]
    (fn []
      [:div.daily-summary-tab.h-full.flex.flex-col
       [:div.header.border-b.pb-4.mb-4
        [:div.flex.justify-between.items-center
         [:h2.text-xl.font-semibold.text-gray-900 "Daily Summary"]
         [:div.flex.items-center.space-x-4
          [:select.text-sm.bg-white.border.border-gray-300.rounded.px-3.py-2.focus:outline-none.focus:ring-2.focus:ring-blue-500
           {:value @selected-period
            :on-change #(reset! selected-period (-> % .-target .-value))
            :disabled @monthly-generating?}
           (for [option (get-month-year-options)]
             ^{:key (:value option)}
             [:option {:value (:value option)} (:label option)])]
          [:button.px-4.py-2.text-sm.bg-blue-500.text-white.rounded.hover:bg-blue-600.disabled:opacity-50
           {:on-click #(let [[year month] (clojure.string/split @selected-period #"-")]
                        (rf/dispatch [:daily-summary/generate-monthly-summaries 
                                     (js/parseInt year) (js/parseInt month)]))
            :disabled @monthly-generating?}
           (if @monthly-generating? "Generating..." "Generate")]
          [:p.text-xs.text-blue-500.font-mono "v2.3.0"]]]
        [:p.text-sm.text-gray-600 "AI summaries for selected month's conversations"]]
       
       [:div.flex-1.overflow-y-auto.p-4
        (cond
          @monthly-generating?
          [:div.flex.justify-center.items-center.py-12
           [:div.animate-spin.rounded-full.h-8.w-8.border-b-2.border-blue-600.mr-3]
           [:span.text-gray-600 "Generating monthly summaries..."]]
          
          (and @monthly-summaries (seq @monthly-summaries))
          [:div.space-y-6
           (for [[date summary-data] (sort @monthly-summaries)]
             ^{:key date}
             [:div.border.border-gray-200.rounded-lg.p-6.bg-white.shadow-sm
              [:div.mb-4
               [:h4.text-xl.font-semibold.text-gray-800
                (try
                  (let [clean-date (if (clojure.string/starts-with? (str date) ":")
                                    (subs (str date) 1)
                                    (str date))
                        date-obj (js/Date. (str clean-date "T00:00:00.000Z"))]
                    (.toLocaleDateString date-obj "en-US" 
                                       #js {:weekday "long" :month "long" :day "numeric" :year "numeric"}))
                  (catch js/Error _
                    (str "Date: " date)))]]
              [:div.text-gray-700.leading-relaxed.space-y-3
               (let [summary-text (:summary summary-data)
                     paragraphs (clojure.string/split summary-text #"\n\n")]
                 (for [paragraph (map clojure.string/trim paragraphs)]
                   (when (not (empty? paragraph))
                     ^{:key paragraph}
                     [:p paragraph])))]])]
          
          :else
          [:div.text-center.py-12
           [:p.text-gray-500.mb-4 "No summaries generated yet"]
           [:p.text-sm.text-gray-400 "Click 'Generate This Month' to create AI summaries of this month's conversations"]])]])))