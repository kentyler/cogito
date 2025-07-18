(ns cogito.subs
  (:require [re-frame.core :as rf]))

(rf/reg-sub
 :current-prompt
 (fn [db]
   (:current-prompt db)))

(rf/reg-sub
 :turns
 (fn [db]
   (:turns db)))

(rf/reg-sub
 :loading?
 (fn [db]
   (:loading? db)))

(rf/reg-sub
 :authenticated?
 (fn [db]
   (:authenticated? db)))

(rf/reg-sub
 :user
 (fn [db]
   (:user db)))

(rf/reg-sub
 :current-alternative-index
 (fn [db [_ turn-id]]
   (get-in db [:alternative-indices turn-id] 0)))

(rf/reg-sub
 :workbench/active-tab
 (fn [db]
   (get db :workbench/active-tab :conversation)))

;; Bot creation subscriptions
(rf/reg-sub
 :bot-creation/loading?
 (fn [db]
   (get db :bot-creation/loading? false)))

(rf/reg-sub
 :bot-creation/message
 (fn [db]
   (get db :bot-creation/message)))

(rf/reg-sub
 :bot-creation/bots
 (fn [db]
   (get db :bot-creation/bots [])))

(rf/reg-sub
 :user-email
 (fn [db]
   (get-in db [:user :email])))

(rf/reg-sub
 :bot-creation/running-bots
 (fn [db]
   (get db :bot-creation/running-bots [])))

(rf/reg-sub
 :bot-creation/fetching-bots?
 (fn [db]
   (get db :bot-creation/fetching-bots? false)))

(rf/reg-sub
 :bot-creation/shutting-down
 (fn [db]
   (get db :bot-creation/shutting-down {})))

;; Stuck meetings subscriptions
(rf/reg-sub
 :stuck-meetings/meetings
 (fn [db]
   (get db :stuck-meetings/meetings [])))

(rf/reg-sub
 :stuck-meetings/fetching?
 (fn [db]
   (get db :stuck-meetings/fetching? false)))

(rf/reg-sub
 :stuck-meetings/completing
 (fn [db]
   (get db :stuck-meetings/completing {})))