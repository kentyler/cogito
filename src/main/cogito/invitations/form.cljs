(ns cogito.invitations.form
  (:require [re-frame.core :as rf]
            [reagent.core :as r]
            [clojure.string :as str]))

(defn invitation-form []
  (let [email (r/atom "")]
    (fn []
      (let [sending @(rf/subscribe [:invitations/sending])
            error @(rf/subscribe [:invitations/error])
            success @(rf/subscribe [:invitations/success-message])]
        [:div.mb-8
         [:h3.text-lg.font-semibold.mb-4 "Send Invitation"]
         [:div.flex.gap-2
          [:input.flex-1.px-3.py-2.border.rounded
           {:type "email"
            :placeholder "Enter email address"
            :value @email
            :disabled sending
            :on-change #(reset! email (-> % .-target .-value))
            :on-key-press #(when (= 13 (.-keyCode %))
                            (when (and (not sending) (not (str/blank? @email)))
                              (rf/dispatch [:invitations/send @email])
                              (reset! email "")))}]
          [:button.px-4.py-2.bg-blue-500.text-white.rounded.hover:bg-blue-600.disabled:opacity-50
           {:disabled (or sending (str/blank? @email))
            :on-click #(do (rf/dispatch [:invitations/send @email])
                          (reset! email ""))}
           (if sending "Sending..." "Send Invitation")]]
         
         (when error
           [:div.mt-2.text-red-600.text-sm error])
         
         (when success
           [:div.mt-2.text-green-600.text-sm success])]))))