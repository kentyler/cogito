(ns cogito.response-renderer
  (:require [reagent.core :as r]
            [re-frame.core :as rf]
            [clojure.string :as str]))

;; The response from LLM should be a ClojureScript data structure like:
;; {:response-type :text
;;  :content "Hello world"}
;;
;; or
;; {:response-type :spreadsheet
;;  :title "Team Analysis"
;;  :headers ["Name" "Role" "Status"]
;;  :data [["Alice" "Lead" "Active"]
;;         ["Bob" "Dev" "Active"]]
;;  :interactions {:on-edit update-cell
;;                 :on-sort sort-by-column}}

(defmulti render-component :response-type)

;; Default text rendering with proper formatting
(defmethod render-component :text [response]
  [:div.text-response.space-y-3
   (for [[idx paragraph] (map-indexed vector (str/split-lines (:content response)))]
     (when-not (str/blank? paragraph)
       ^{:key idx}
       [:p.text-gray-700.leading-relaxed paragraph]))])

;; List rendering
(defmethod render-component :list [response]
  [:ul.list-response.space-y-2.pl-5.list-disc
   (for [[idx item] (map-indexed vector (:items response))]
     ^{:key idx}
     [:li.text-gray-700.leading-relaxed
      {:class (when (get-in response [:interactions :on-click])
                "cursor-pointer hover:text-blue-600 transition-colors")
       :on-click (when-let [handler (get-in response [:interactions :on-click])]
                   #(handler item))}
      item])])

;; Spreadsheet/table rendering
(defmethod render-component :spreadsheet [response]
  [:div.spreadsheet-response
   [:h3 (:title response)]
   [:table
    [:thead
     [:tr
      (for [header (:headers response)]
        ^{:key header}
        [:th header])]]
    [:tbody
     (for [[row-idx row] (map-indexed vector (:data response))]
       ^{:key row-idx}
       [:tr
        (for [[col-idx cell] (map-indexed vector row)]
          ^{:key col-idx}
          [:td cell])])]]])

;; Diagram rendering (simplified for now)
(defmethod render-component :diagram [response]
  [:div.diagram-response
   [:h3 (:title response)]
   [:div.diagram-placeholder
    "Diagram visualization would render here"
    [:pre (pr-str (:nodes response))]]])

;; Email draft rendering
(defmethod render-component :email [response]
  [:div.email-response
   [:div.email-header
    [:div [:strong "To: "] (:to response)]
    [:div [:strong "Subject: "] (:subject response)]]
   [:div.email-body
    {:contentEditable true
     :on-blur (when-let [handler (get-in response [:interactions :on-edit])]
                #(handler (-> % .-target .-innerText)))}
    (:body response)]])

;; Response set rendering with navigation
(defmethod render-component :response-set [response]
  (let [alternatives (:alternatives response)
        turn-id (:turn-id response) ;; We'll need to pass this from the workbench
        current-index (rf/subscribe [:current-alternative-index turn-id])
        set-index! (fn [index] 
                     (rf/dispatch [:set-current-alternative turn-id index]))
        current-alt (fn [] (nth alternatives (or @current-index 0)))]
    (fn [response]
      (let [alt (current-alt)
            total-count (count alternatives)
            index (or @current-index 0)]
        [:div.response-set.border.border-gray-200.rounded-lg.p-4.space-y-4
         ;; Header with alternative summary
         [:div.bg-gray-50.rounded-md.p-3
          [:h3.text-sm.font-semibold.text-gray-700.mb-1 
           (str "Response " (inc index) " of " total-count)]
          [:p.text-sm.text-gray-600 (:summary alt)]]
         
         ;; Current alternative display
         [:div.alternative-content.pl-4.border-l-4.border-blue-400
          [render-component alt]]
         
         ;; Navigation controls
         [:div.navigation-controls.flex.items-center.justify-between.pt-3.border-t.border-gray-200
          [:div.nav-buttons.flex.gap-2
           ;; First button |<
           [:button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors
            {:disabled (= index 0)
             :on-click #(set-index! 0)}
            "|<"]
           
           ;; Previous button <<
           [:button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors
            {:disabled (= index 0)
             :on-click #(set-index! (dec index))}
            "<<"]
           
           ;; Next button >>
           [:button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors
            {:disabled (= index (dec total-count))
             :on-click #(set-index! (inc index))}
            ">>"]
           
           ;; Last button >|
           [:button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors
            {:disabled (= index (dec total-count))
             :on-click #(set-index! (dec total-count))}
            ">|"]]
          
          ;; Alternative pills
          [:div.flex.gap-1
           (for [i (range total-count)]
             ^{:key i}
             [:button.w-2.h-2.rounded-full.transition-colors
              {:class (if (= i index) "bg-blue-500" "bg-gray-300 hover:bg-gray-400")
               :on-click #(set-index! i)}])]]]))))

;; Default fallback - extract displayable content
(defmethod render-component :default [response]
  (let [;; Try to extract meaningful content from various possible keys
        content (or (:content response)
                    (:summary response)
                    (:text response)
                    (:body response)
                    (:message response)
                    ;; If it has :items, render as a list
                    (when-let [items (:items response)]
                      (str/join "\n" items))
                    ;; If it has :data, try to render it meaningfully
                    (when-let [data (:data response)]
                      (if (sequential? data)
                        (str/join "\n" (map str data))
                        (str data))))]
    (if content
      ;; If we found content, render it as plain text
      [:div.text-response.space-y-3
       (for [[idx paragraph] (map-indexed vector (str/split-lines (str content)))]
         (when-not (str/blank? paragraph)
           ^{:key idx}
           [:p.text-gray-700.leading-relaxed paragraph]))]
      ;; Only show raw EDN if we couldn't extract any content
      [:div.unknown-response.text-gray-500.text-sm
       [:p.mb-2 "Unknown response format:"]
       [:pre.bg-gray-100.p-2.rounded.text-xs (pr-str response)]])))

(defn render-response [response]
  ;; Handle both string responses and structured responses
  (if (string? response)
    [:div.text-response response]
    [render-component response]))