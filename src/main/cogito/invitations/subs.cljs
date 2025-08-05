(ns cogito.invitations.subs
  (:require [re-frame.core :as rf]))

;; Subscriptions
(rf/reg-sub
 :invitations/sending
 (fn [db _]
   (:invitations/sending db)))

(rf/reg-sub
 :invitations/error
 (fn [db _]
   (:invitations/error db)))

(rf/reg-sub
 :invitations/success-message
 (fn [db _]
   (:invitations/success-message db)))

(rf/reg-sub
 :invitations/pending
 (fn [db _]
   (:invitations/pending db [])))

(rf/reg-sub
 :invitations/loading
 (fn [db _]
   (:invitations/loading db)))