(ns cogito.monthly-summary
  (:require [reagent.core :as r]
            [re-frame.core :as rf]
            [clojure.string :as str]))

(defn get-year-options []
  "Generate year options for the past 3 years"
  (let [current-year (.getFullYear (js/Date.))
        start-year (- current-year 2)]
    (for [year (range start-year (inc (inc current-year)))]
      {:value year
       :label (str year)})))

(defn monthly-summary-tab []
  (let [yearly-summaries (rf/subscribe [:monthly-summary/yearly-summaries])
        yearly-generating? (rf/subscribe [:monthly-summary/yearly-summaries-generating?])
        selected-year (r/atom (.getFullYear (js/Date.)))]
    (fn []
      [:div.monthly-summary-tab.h-full.flex.flex-col
       [:div.header.border-b.pb-4.mb-4
        [:div.flex.justify-between.items-center
         [:h2.text-xl.font-semibold.text-gray-900 "Monthly Summary"]
         [:div.flex.items-center.space-x-4
          [:select.text-sm.bg-white.border.border-gray-300.rounded.px-3.py-2.focus:outline-none.focus:ring-2.focus:ring-blue-500
           {:value @selected-year
            :on-change #(reset! selected-year (js/parseInt (-> % .-target .-value)))
            :disabled @yearly-generating?}
           (for [option (get-year-options)]
             ^{:key (:value option)}
             [:option {:value (:value option)} (:label option)])]
          [:button.px-4.py-2.text-sm.bg-green-500.text-white.rounded.hover:bg-green-600.disabled:opacity-50.flex.items-center.space-x-2
           {:on-click #(rf/dispatch [:monthly-summary/generate-yearly-summaries @selected-year])
            :disabled @yearly-generating?}
           (when @yearly-generating?
             [:div.animate-spin.rounded-full.h-4.w-4.border-b-2.border-white])
           [:span (if @yearly-generating? "Generating..." "Generate Year")]]
          [:p.text-xs.text-green-500.font-mono "v1.0.0"]]]
        [:p.text-sm.text-gray-600 "AI summaries for each month of the selected year"]]
       
       [:div.flex-1.overflow-y-auto.p-4
        (cond
          @yearly-generating?
          [:div.flex.justify-center.items-center.py-12
           [:div.animate-spin.rounded-full.h-8.w-8.border-b-2.border-green-600.mr-3]
           [:span.text-gray-600 "Generating yearly summaries..."]]
          
          (and @yearly-summaries (seq @yearly-summaries))
          [:div.space-y-6
           (for [[month summary-data] (sort-by first @yearly-summaries)]
             ^{:key month}
             [:div.border.border-gray-200.rounded-lg.p-6.bg-white.shadow-sm
              [:div.mb-4
               [:h4.text-xl.font-semibold.text-gray-800
                (try
                  ;; month comes from backend as 0-11 (JS month format)
                  (let [month-num (if (string? month) (js/parseInt month) month)
                        date-obj (js/Date. @selected-year month-num 1)]
                    (if (js/isNaN (.getTime date-obj))
                      (str "Month " month " " @selected-year)
                      (.toLocaleDateString date-obj "en-US" 
                                         #js {:month "long" :year "numeric"})))
                  (catch js/Error e
                    (str "Month " month " " @selected-year " (Error: " (.-message e) ")")))]]
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
           [:p.text-sm.text-gray-400 "Click 'Generate Year' to create AI summaries for each month of the selected year"]])]])))