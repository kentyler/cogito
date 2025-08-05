(ns cogito.invitations
  (:require [re-frame.core :as rf]
            [reagent.core :as r]
            [cogito.invitations.events]
            [cogito.invitations.subs]
            [cogito.invitations.form :refer [invitation-form]]
            [cogito.invitations.list :refer [pending-invitations]]))

(defn invitations-panel []
  (r/create-class
   {:component-did-mount
    (fn []
      (rf/dispatch [:invitations/load-pending])
      ;; Clear any messages after 5 seconds
      (js/setTimeout #(rf/dispatch [:invitations/clear-messages]) 5000))
    
    :reagent-render
    (fn []
      [:div.p-6
       [:h2.text-2xl.font-bold.mb-6 "Team Invitations"]
       [:div.max-w-2xl
        [invitation-form]
        [pending-invitations]]])}))