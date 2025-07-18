(ns cogito.events
  (:require [re-frame.core :as rf]
            [cogito.db :as db]
            [ajax.core :as ajax]
            [day8.re-frame.http-fx]))

(rf/reg-event-db
 :initialize-db
 (fn [_ _]
   db/default-db))

(rf/reg-event-db
 :set-current-prompt
 (fn [db [_ prompt]]
   (assoc db :current-prompt prompt)))

(rf/reg-event-fx
 :submit-prompt
 (fn [{:keys [db]} [_ prompt]]
   ;; Find the most recent response-set and include current alternative context
   (let [most-recent-turn (last (:turns db))
         response-context (when (and most-recent-turn 
                                    (= :response-set (get-in most-recent-turn [:response :response-type])))
                           (let [turn-id (:id most-recent-turn)
                                 current-index (get-in db [:alternative-indices turn-id] 0)
                                 alternatives (get-in most-recent-turn [:response :alternatives])
                                 selected-alt (nth alternatives current-index nil)]
                             {:responding-to-alternative {:turn-id turn-id
                                                         :alternative-index current-index
                                                         :alternative-id (:id selected-alt)
                                                         :alternative-summary (:summary selected-alt)}}))]
     {:db (assoc db :loading? true)
      :fetch-response {:prompt prompt
                       :conversation-id (:conversation-id db)
                       :context response-context}})))

(rf/reg-fx
 :fetch-response
 (fn [{:keys [prompt conversation-id context]}]
   (-> (js/fetch "/api/conversational-turn"
                 (clj->js {:method "POST"
                           :headers {"Content-Type" "application/json"}
                           :credentials "include"
                           :body (js/JSON.stringify (clj->js {:content prompt
                                                             :conversation_id conversation-id
                                                             :context context}))}))
       (.then #(.json %))
       (.then #(rf/dispatch [:handle-llm-response (js->clj % :keywordize-keys true)]))
       (.catch #(rf/dispatch [:handle-error %])))))

(rf/reg-event-db
 :handle-llm-response
 (fn [db [_ response]]
   (let [parsed-response (try
                          ;; Try to parse the ClojureScript response
                          (js/eval (str "(" (:response response) ")"))
                          (catch js/Error e
                            {:response-type :text
                             :content (str "Parse error: " (:response response))}))]
     (-> db
         (assoc :loading? false
                :current-prompt ""
                :conversation-id (or (:conversation-id response) 
                                    (:conversation-id db)))
         (update :turns conj {:id (:id response)
                             :prompt (:prompt response)
                             :response parsed-response})))))

(rf/reg-event-db
 :handle-error
 (fn [db [_ error]]
   (assoc db :loading? false
            :error error)))

(rf/reg-event-fx
 :check-auth-status
 (fn [_ _]
   {:fetch-auth-status {}}))

(rf/reg-fx
 :fetch-auth-status
 (fn [_]
   (-> (js/fetch "/api/auth-status"
                 (clj->js {:credentials "include"}))
       (.then #(.json %))
       (.then #(rf/dispatch [:auth-status-received (js->clj % :keywordize-keys true)]))
       (.catch #(rf/dispatch [:auth-status-received {:authenticated false}])))))

(rf/reg-event-db
 :auth-status-received
 (fn [db [_ response]]
   (assoc db :authenticated? (:authenticated response)
             :user (:user response))))

(rf/reg-event-db
 :login-success
 (fn [db [_ response]]
   (assoc db :authenticated? true
             :user (:user response))))

;; Alternative index tracking for response sets
(rf/reg-event-db
 :set-current-alternative
 (fn [db [_ turn-id index]]
   (assoc-in db [:alternative-indices turn-id] index)))

;; Get the currently selected alternative for a given turn
(rf/reg-event-db
 :get-current-alternative
 (fn [db [_ turn-id]]
   (get-in db [:alternative-indices turn-id] 0)))

;; Workbench tab management
(rf/reg-event-db
 :workbench/set-active-tab
 (fn [db [_ tab]]
   (assoc db :workbench/active-tab tab)))

;; Bot creation events
(rf/reg-event-fx
 :bot-creation/create-bot
 (fn [{:keys [db]} [_ form-data]]
   {:db (-> db
            (assoc :bot-creation/loading? true)
            (dissoc :bot-creation/message))
    :http-xhrio {:method          :post
                 :uri             "/api/create-bot"
                 :params          {:meeting_url (:meeting-url form-data)
                                   :meeting_name (:meeting-name form-data)}
                 :format          (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success      [:bot-creation/create-success]
                 :on-failure      [:bot-creation/create-failure]}}))

(rf/reg-event-fx
 :bot-creation/create-success
 (fn [{:keys [db]} [_ response]]
   {:db (-> db
            (assoc :bot-creation/loading? false)
            (assoc :bot-creation/message {:type :success
                                         :text "Bot created successfully! The bot will join your meeting."})
            (update :bot-creation/bots conj response))
    :dispatch [:bot-creation/fetch-bots]}))

(rf/reg-event-db
 :bot-creation/create-failure
 (fn [db [_ response]]
   (let [error-message (or (get-in response [:response :error])
                          "Failed to create bot. Please try again.")]
     (-> db
         (assoc :bot-creation/loading? false)
         (assoc :bot-creation/message {:type :error
                                       :text error-message})))))

;; Fetch running bots
(rf/reg-event-fx
 :bot-creation/fetch-bots
 (fn [{:keys [db]} _]
   {:db (assoc db :bot-creation/fetching-bots? true)
    :http-xhrio {:method          :get
                 :uri             "/api/bots"
                 :format          (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success      [:bot-creation/fetch-bots-success]
                 :on-failure      [:bot-creation/fetch-bots-failure]}}))

(rf/reg-event-db
 :bot-creation/fetch-bots-success
 (fn [db [_ bots]]
   (-> db
       (assoc :bot-creation/fetching-bots? false)
       (assoc :bot-creation/running-bots bots))))

(rf/reg-event-db
 :bot-creation/fetch-bots-failure
 (fn [db [_ response]]
   (-> db
       (assoc :bot-creation/fetching-bots? false)
       (assoc :bot-creation/running-bots []))))

;; Shutdown bot
(rf/reg-event-fx
 :bot-creation/shutdown-bot
 (fn [{:keys [db]} [_ bot-id]]
   {:db (assoc-in db [:bot-creation/shutting-down bot-id] true)
    :http-xhrio {:method          :post
                 :uri             (str "/api/bots/" bot-id "/leave")
                 :format          (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success      [:bot-creation/shutdown-success bot-id]
                 :on-failure      [:bot-creation/shutdown-failure bot-id]}}))

(rf/reg-event-fx
 :bot-creation/shutdown-success
 (fn [{:keys [db]} [_ bot-id response]]
   {:db (-> db
            (update :bot-creation/shutting-down dissoc bot-id)
            (assoc :bot-creation/message {:type :success
                                         :text "Bot shut down successfully"}))
    :dispatch [:bot-creation/fetch-bots]}))

(rf/reg-event-db
 :bot-creation/shutdown-failure
 (fn [db [_ bot-id response]]
   (-> db
       (update :bot-creation/shutting-down dissoc bot-id)
       (assoc :bot-creation/message {:type :error
                                     :text "Failed to shut down bot"}))))

;; Stuck meetings events
(rf/reg-event-fx
 :stuck-meetings/fetch
 (fn [{:keys [db]} _]
   {:db (assoc db :stuck-meetings/fetching? true)
    :http-xhrio {:method          :get
                 :uri             "/api/stuck-meetings"
                 :format          (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success      [:stuck-meetings/fetch-success]
                 :on-failure      [:stuck-meetings/fetch-failure]}}))

(rf/reg-event-db
 :stuck-meetings/fetch-success
 (fn [db [_ meetings]]
   (-> db
       (assoc :stuck-meetings/fetching? false)
       (assoc :stuck-meetings/meetings meetings))))

(rf/reg-event-db
 :stuck-meetings/fetch-failure
 (fn [db [_ response]]
   (-> db
       (assoc :stuck-meetings/fetching? false)
       (assoc :stuck-meetings/meetings []))))

;; Force complete stuck meeting
(rf/reg-event-fx
 :stuck-meetings/force-complete
 (fn [{:keys [db]} [_ meeting-id]]
   {:db (assoc-in db [:stuck-meetings/completing meeting-id] true)
    :http-xhrio {:method          :post
                 :uri             (str "/api/stuck-meetings/" meeting-id "/complete")
                 :format          (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success      [:stuck-meetings/complete-success meeting-id]
                 :on-failure      [:stuck-meetings/complete-failure meeting-id]}}))

(rf/reg-event-fx
 :stuck-meetings/complete-success
 (fn [{:keys [db]} [_ meeting-id response]]
   {:db (-> db
            (update :stuck-meetings/completing dissoc meeting-id)
            (assoc :bot-creation/message {:type :success
                                         :text "Meeting marked as completed"}))
    :dispatch [:stuck-meetings/fetch]}))

(rf/reg-event-db
 :stuck-meetings/complete-failure
 (fn [db [_ meeting-id response]]
   (-> db
       (update :stuck-meetings/completing dissoc meeting-id)
       (assoc :bot-creation/message {:type :error
                                     :text "Failed to complete meeting"}))))