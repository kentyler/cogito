(ns cogito.client-selection
  (:require [reagent.core :as r]
            [re-frame.core :as rf]))

(defn client-selection-form []
  (let [available-clients (rf/subscribe [:available-clients])
        selecting? (rf/subscribe [:selecting-client?])
        error (rf/subscribe [:client-selection-error])
        selected-client (r/atom nil)]
    (fn []
      (js/console.log "Available clients:" (clj->js @available-clients))
      [:div.client-selection-form
       [:h2 "Select Client Account"]
       [:p.text-gray-600.mb-4 "You have access to multiple client accounts. Please select which one to use:"]
       
       (when @error
         [:div.error-message.bg-red-100.text-red-700.p-3.rounded.mb-4
          @error])
       
       [:form
        {:on-submit (fn [e]
                      (.preventDefault e)
                      (when @selected-client
                        (rf/dispatch [:select-client (:client_id @selected-client)])))}
        
        [:div.space-y-3.mb-6
         [:div "Debug: " (str @available-clients)]
         (for [client @available-clients]
           ^{:key (:client_id client)}
           [:label.flex.items-center.p-3.border.rounded.cursor-pointer.hover:bg-gray-50
            {:class (if (= client @selected-client) "border-blue-500 bg-blue-50" "border-gray-300")}
            [:input.mr-3
             {:type "radio"
              :name "client"
              :value (:client_id client)
              :checked (= client @selected-client)
              :on-change #(reset! selected-client client)}]
            [:div
             [:div.font-medium (:client_name client)]
             (when (:role client)
               [:div.text-sm.text-gray-600 (str "Role: " (:role client))])]])]
        
        [:button.w-full.px-4.py-2.bg-blue-600.text-white.rounded.hover:bg-blue-700.disabled:opacity-50.disabled:cursor-not-allowed
         {:type "submit"
          :disabled (or @selecting? (nil? @selected-client))}
         (if @selecting? "Selecting..." "Continue")]]])))