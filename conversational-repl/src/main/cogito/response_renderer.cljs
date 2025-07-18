(ns cogito.response-renderer
  (:require [reagent.core :as r]
            [re-frame.core :as rf]))

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

;; Default text rendering
(defmethod render-component :text [response]
  [:div.text-response (:content response)])

;; List rendering
(defmethod render-component :list [response]
  [:ul.list-response
   (for [[idx item] (map-indexed vector (:items response))]
     ^{:key idx}
     [:li 
      {:on-click (when-let [handler (get-in response [:interactions :on-click])]
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
        [:div.response-set
         ;; Current alternative display
         [:div.alternative-content
          [render-component alt]]
         
         ;; Navigation controls
         [:div.navigation-controls
          [:div.nav-buttons
           ;; First button |<
           [:button.nav-btn
            {:disabled (= index 0)
             :on-click #(set-index! 0)}
            "|<"]
           
           ;; Previous button <<
           [:button.nav-btn
            {:disabled (= index 0)
             :on-click #(set-index! (dec index))}
            "<<"]
           
           ;; Next button >>
           [:button.nav-btn
            {:disabled (= index (dec total-count))
             :on-click #(set-index! (inc index))}
            ">>"]
           
           ;; Last button >|
           [:button.nav-btn
            {:disabled (= index (dec total-count))
             :on-click #(set-index! (dec total-count))}
            ">|"]]
          
          ;; Counter display
          [:div.nav-counter
           (str (inc index) " of " total-count)]
          
          ;; Alternative summary
          [:div.alternative-summary
           (:summary alt)]]]))))

;; Default fallback
(defmethod render-component :default [response]
  [:div.unknown-response
   [:pre (pr-str response)]])

(defn render-response [response]
  ;; Handle both string responses and structured responses
  (if (string? response)
    [:div.text-response response]
    [render-component response]))