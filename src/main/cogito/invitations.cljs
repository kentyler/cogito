(ns cogito.invitations
  (:require [re-frame.core :as rf]
            [reagent.core :as r]
            [clojure.string :as str]
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

;; Components
(defn invitation-form []
  (let [email (r/atom "")
        sending @(rf/subscribe [:invitations/sending])
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
       [:div.mt-2.text-green-600.text-sm success])]))

(defn pending-invitations []
  (let [loading @(rf/subscribe [:invitations/loading])
        invitations @(rf/subscribe [:invitations/pending])]
    [:div
     [:h3.text-lg.font-semibold.mb-4 "Pending Invitations"]
     (cond
       loading
       [:div.text-gray-500 "Loading..."]
       
       (empty? invitations)
       [:div.text-gray-500 "No pending invitations"]
       
       :else
       [:div.space-y-2
        (for [invitation invitations]
          ^{:key (:id invitation)}
          [:div.p-3.border.rounded
           [:div.font-medium (:email invitation)]
           [:div.text-sm.text-gray-600
            (str "Invited by " (:invited_by invitation)
                 " on " (.toLocaleDateString (js/Date. (:invited_at invitation))))]])])]))

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