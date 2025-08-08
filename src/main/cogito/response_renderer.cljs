(ns cogito.response-renderer
  (:require [reagent.core :as r]
            [re-frame.core :as rf]
            [clojure.string :as str]))

;; Reference popup state
(defonce popup-state (r/atom {:visible false :content nil :position nil}))

;; Reference popup component
(defn reference-popup []
  (when (:visible @popup-state)
    [:div.fixed.inset-0.z-50.flex.items-center.justify-center
     {:on-click #(swap! popup-state assoc :visible false)}
     [:div.absolute.inset-0.bg-black.bg-opacity-50]
     [:div.relative.bg-white.rounded-lg.shadow-xl.max-w-2xl.max-h-96.p-6.overflow-auto
      {:on-click #(.stopPropagation %)}
      [:div.flex.justify-between.items-start.mb-4
       [:h3.text-lg.font-semibold.text-gray-900 
        (str "Reference " (:id (:content @popup-state)))]
       [:button.text-gray-400.hover:text-gray-600.text-2xl.leading-none
        {:on-click #(swap! popup-state assoc :visible false)}
        "×"]]
      [:div.space-y-3
       (let [content (:content @popup-state)]
         (case (:type content)
           "discussion" 
           [:div
            [:div.text-sm.text-gray-500.mb-2
             (str "Past Discussion • " 
                  (when (:timestamp content)
                    (str (.toLocaleDateString (js/Date. (:timestamp content))) " • "))
                  "Similarity: " (:similarity content))]
            [:div.text-gray-800.whitespace-pre-wrap (:content content)]]
           
           "file"
           [:div
            [:div.text-sm.text-gray-500.mb-2
             (str "File: " (:filename content) " • " 
                  (when (:uploadDate content)
                    (str "Uploaded: " (.toLocaleDateString (js/Date. (:uploadDate content))) " • "))
                  "Similarity: " (:similarity content))]
            [:div.text-gray-800.whitespace-pre-wrap (:content content)]]
           
           [:div.text-gray-800.whitespace-pre-wrap 
            (or (:content content) "No content available")]))]
      [:div.mt-4.flex.justify-end
       [:button.px-4.py-2.bg-gray-100.hover:bg-gray-200.text-gray-800.rounded.transition-colors
        {:on-click #(swap! popup-state assoc :visible false)}
        "Close"]]]]))

;; Function to show reference popup
(defn show-reference-popup [sources ref-id]
  (when-let [source (first (filter #(= (:id %) ref-id) sources))]
    (swap! popup-state assoc 
           :visible true 
           :content source)))

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

;; Component to render reference footnotes
(defn render-reference-footnotes [sources]
  (when (and sources (seq sources))
    [:div.mt-6.pt-4.border-t.border-gray-200
     [:h4.text-sm.font-semibold.text-gray-600.mb-3 "References"]
     [:div.space-y-2
      (for [source sources]
        ^{:key (str "ref-" (:id source))}
        [:div.text-sm.bg-gray-50.p-3.rounded
         [:div.flex.items-start
          [:span.font-medium.text-blue-600.mr-2 (str "[REF-" (:id source) "]")]
          [:div.flex-1
           (case (:type source)
             "discussion"
             [:div
              [:span.text-gray-600 "Past discussion"]
              (when (:timestamp source)
                [:span.text-gray-500.ml-2 
                 (str "(" (.toLocaleDateString (js/Date. (:timestamp source))) ")")])
              (when (:similarity source)
                [:span.text-gray-400.ml-2.text-xs 
                 (str "Relevance: " (:similarity source))])
              (when (:content source)
                [:div.mt-1.text-gray-700.line-clamp-2
                 (subs (:content source) 0 (min 200 (count (:content source)))) "..."])]
             
             "file"
             [:div
              [:span.text-gray-600 (str "File: " (:filename source))]
              (when (:uploadDate source)
                [:span.text-gray-500.ml-2
                 (str "(" (.toLocaleDateString (js/Date. (:uploadDate source))) ")")])
              (when (:similarity source)
                [:span.text-gray-400.ml-2.text-xs
                 (str "Relevance: " (:similarity source))])
              (when (:content source)
                [:div.mt-1.text-gray-700.line-clamp-2
                 (subs (:content source) 0 (min 200 (count (:content source)))) "..."])]
             
             ;; Default case
             [:div.text-gray-600 "Reference source"])]]])]]))

;; Default text rendering with footnote references
(defmethod render-component :text [response]
  [:div.text-response
   ;; Main content
   [:div.space-y-3
    (for [[idx paragraph] (map-indexed vector (str/split-lines (:content response)))]
      (when-not (str/blank? paragraph)
        ^{:key idx}
        [:p.text-gray-700.leading-relaxed paragraph]))]
   ;; Reference footnotes
   [render-reference-footnotes (:sources response)]])

;; List rendering with footnote references
(defmethod render-component :list [response]
  [:div.list-response
   [:ul.space-y-2.pl-5.list-disc
    (for [[idx item] (map-indexed vector (:items response))]
      ^{:key idx}
      [:li.text-gray-700.leading-relaxed
       {:class (when (get-in response [:interactions :on-click])
                 "cursor-pointer hover:text-blue-600 transition-colors")
        :on-click (when-let [handler (get-in response [:interactions :on-click])]
                    #(handler item))}
       item])]
   ;; Reference footnotes
   [render-reference-footnotes (:sources response)]])

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
          [:td cell])])]]
   ;; Reference footnotes
   [render-reference-footnotes (:sources response)]])

;; Diagram rendering (simplified for now)
(defmethod render-component :diagram [response]
  [:div.diagram-response
   [:h3 (:title response)]
   [:div.diagram-placeholder
    "Diagram visualization would render here"
    [:pre (pr-str (:nodes response))]]
   ;; Reference footnotes
   [render-reference-footnotes (:sources response)]])

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
    (:body response)]
   ;; Reference footnotes
   [render-reference-footnotes (:sources response)]])

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
         
         ;; Current alternative display - pass sources through
         [:div.alternative-content.pl-4.border-l-4.border-blue-400
          [render-component (assoc alt :sources (:sources response))]]
         
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
    [:div
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
        [:pre.bg-gray-100.p-2.rounded.text-xs (pr-str response)]])
     ;; Reference footnotes
     [render-reference-footnotes (:sources response)]]))

(defn render-response [response]
  ;; Handle both string responses and structured responses
  [:div.relative
   ;; Include the popup component
   [reference-popup]
   ;; Render the main response
   (if (string? response)
     [:div.text-response response]
     [render-component response])])