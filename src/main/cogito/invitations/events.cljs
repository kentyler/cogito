(ns cogito.invitations.events
  (:require [re-frame.core :as rf]
            [ajax.core :as ajax]))

;; Events
(rf/reg-event-fx
 :invitations/send
 (fn [{:keys [db]} [_ email]]
   {:db (assoc db :invitations/sending true
               :invitations/error nil)
    :http-xhrio {:method :post
                 :uri "/api/invitations/send"
                 :params {:email email}
                 :format (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:invitations/send-success]
                 :on-failure [:invitations/send-failure]}}))

(rf/reg-event-db
 :invitations/send-success
 (fn [db [_ response]]
   (-> db
       (assoc :invitations/sending false
              :invitations/success-message (str "Invitation sent to " (:email response)))
       (update :invitations/sent conj (:email response))
       (update :invitations/pending-count inc))))

(rf/reg-event-db
 :invitations/send-failure
 (fn [db [_ {:keys [response]}]]
   (assoc db :invitations/sending false
             :invitations/error (or (:error response) "Failed to send invitation"))))

(rf/reg-event-fx
 :invitations/load-pending
 (fn [{:keys [db]} _]
   {:db (assoc db :invitations/loading true)
    :http-xhrio {:method :get
                 :uri "/api/invitations/pending"
                 :format (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:invitations/load-success]
                 :on-failure [:invitations/load-failure]}}))

(rf/reg-event-db
 :invitations/load-success
 (fn [db [_ response]]
   (assoc db :invitations/loading false
             :invitations/pending (:invitations response))))

(rf/reg-event-db
 :invitations/load-failure
 (fn [db [_ _]]
   (assoc db :invitations/loading false
             :invitations/pending [])))

(rf/reg-event-db
 :invitations/clear-messages
 (fn [db _]
   (dissoc db :invitations/error :invitations/success-message)))