(ns cogito.client-selector
  (:require [re-frame.core :as rf]))

(defn client-switching-spinner []
  [:div.flex.items-center.space-x-2
   [:span.text-sm.text-gray-500 "Switching clients..."]
   [:div.animate-spin.rounded-full.h-3.w-3.border-b-2.border-blue-600]])

(defn client-dropdown [user available-clients switching-client?]
  [:select.text-sm.bg-white.border.border-gray-300.rounded.px-2.py-1.focus:outline-none.focus:ring-2.focus:ring-blue-500
   {:value (str (:client @user))
    :on-change #(let [selected-client-name (-> % .-target .-value)
                      selected-client (first (filter (fn [c] (= (:client_name c) selected-client-name)) @available-clients))]
                  (when selected-client
                    (rf/dispatch [:switch-client (:client_id selected-client)])))
    :disabled @switching-client?}
   (for [client @available-clients]
     ^{:key (:client_id client)}
     [:option {:value (:client_name client)} 
      (:client_name client)])])

(defn multi-client-section [user available-clients switching-client?]
  [:div.flex.items-center.space-x-2
   [:span.text-sm.text-gray-600 (str "Logged in as " (:email @user) " to\u00A0")]
   (if @switching-client?
     [client-switching-spinner]
     [client-dropdown user available-clients switching-client?])])

(defn single-client-section [user]
  [:span.text-sm.text-gray-600 
   (str "Logged in as " (when (:client @user) (str (:client @user) ":")) (:email @user))])

(defn client-selector []
  (let [user (rf/subscribe [:user])
        available-clients (rf/subscribe [:available-clients])
        switching-client? (rf/subscribe [:switching-client?])]
    (fn []
      (if (> (count @available-clients) 1)
        [multi-client-section user available-clients switching-client?]
        [single-client-section user]))))