(ns cogito.events
  (:require [re-frame.core :as rf]
            [cogito.db :as db]
            [ajax.core :as ajax]
            [day8.re-frame.http-fx]
            [cogito.edn-parser :as parser]))

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
                       :context response-context}})))

(rf/reg-fx
 :fetch-response
 (fn [{:keys [prompt context]}]
   (-> (js/fetch "/api/conversational-turn"
                 (clj->js {:method "POST"
                           :headers {"Content-Type" "application/json"}
                           :credentials "include"
                           :body (js/JSON.stringify (clj->js {:content prompt
                                                             :context context}))}))
       (.then #(.json %))
       (.then #(rf/dispatch [:handle-llm-response (js->clj % :keywordize-keys true)]))
       (.catch #(rf/dispatch [:handle-error %])))))

(rf/reg-event-db
 :handle-llm-response
 (fn [db [_ response]]
   (js/console.log "Events: Received response from server:" response)
   (let [parsed-response (parser/parse-cljs-response (:response response))
         sources (:sources response)]
     (js/console.log "Events: Parsed response:" parsed-response)
     (js/console.log "Events: Sources received:" sources)
     (-> db
         (assoc :loading? false
                :current-prompt "")
         (update :turns conj {:id (:id response)
                             :prompt (:prompt response)
                             :response parsed-response
                             :sources sources})))))

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
             :pending-client-selection? (:pendingClientSelection response)
             :available-clients (:clients response)
             :user (:user response))))

(rf/reg-event-db
 :login-success
 (fn [db [_ response]]
   (if (:clients response)
     ;; Multiple clients - show selection
     (assoc db :authenticated? false
               :pending-client-selection? true
               :available-clients (:clients response))
     ;; Single client - auto login  
     (assoc db :authenticated? true
               :user (:user response)))))

;; Client selection events
(rf/reg-event-fx
 :select-client
 (fn [{:keys [db]} [_ client-id]]
   {:db (assoc db :selecting-client? true)
    :http-xhrio {:method :post
                 :uri "/api/select-client"
                 :headers {"Content-Type" "application/json"}
                 :params {:client_id client-id}
                 :format (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:client-selected]
                 :on-failure [:client-selection-failed]}}))

(rf/reg-event-db
 :client-selected
 (fn [db [_ response]]
   (assoc db :authenticated? true
             :pending-client-selection? false
             :selecting-client? false
             :available-clients nil
             :user (:user response))))

(rf/reg-event-db
 :client-selection-failed
 (fn [db [_ error]]
   (assoc db :selecting-client? false
             :client-selection-error "Failed to select client")))

;; Logout event
(rf/reg-event-fx
 :logout
 (fn [{:keys [db]} _]
   {:db (assoc db :logging-out? true)
    :http-xhrio {:method :post
                 :uri "/api/logout"
                 :headers {"Content-Type" "application/json"}
                 :format (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:logout-success]
                 :on-failure [:logout-success]}})) ; Treat failure as success for logout

;; Fetch available clients for current user
(rf/reg-event-fx
 :fetch-available-clients
 (fn [{:keys [db]} _]
   {:http-xhrio {:method :get
                 :uri "/api/available-clients"
                 :headers {"Content-Type" "application/json"}
                 :format (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:available-clients-received]
                 :on-failure [:available-clients-failed]}}))

(rf/reg-event-db
 :available-clients-received
 (fn [db [_ response]]
   (assoc db :available-clients (:clients response)
             :current-client-id (:current_client_id response))))

(rf/reg-event-db
 :available-clients-failed
 (fn [db [_ error]]
   (assoc db :available-clients-error "Failed to fetch available clients")))

;; Switch client
(rf/reg-event-fx
 :switch-client
 (fn [{:keys [db]} [_ client-id]]
   {:db (assoc db :switching-client? true)
    :http-xhrio {:method :post
                 :uri "/api/switch-client"
                 :headers {"Content-Type" "application/json"}
                 :params {:client_id client-id}
                 :format (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:client-switched]
                 :on-failure [:client-switch-failed]}}))

(rf/reg-event-fx
 :client-switched
 (fn [{:keys [db]} [_ response]]
   {:db (-> db 
            (assoc :switching-client? false
                   :user (:user response))
            (dissoc :meetings :meetings-error)  ; Clear old meetings data
            (dissoc :selected-meeting)  ; Clear any selected meeting
            (dissoc :bot-creation/bots :bot-creation/running-bots)  ; Clear old bot data
            (dissoc :stuck-meetings/meetings))  ; Clear old stuck meetings
    :dispatch-n [[:cogito.meetings/load-meetings]  ; Refresh meetings for new client
                 [:bot-creation/fetch-bots]  ; Refresh bots for new client
                 [:fetch-available-clients]]}))

(rf/reg-event-db
 :client-switch-failed
 (fn [db [_ error]]
   (assoc db :switching-client? false
             :client-switch-error "Failed to switch client")))

(rf/reg-event-db
 :logout-success
 (fn [db _]
   {:authenticated? false
    :pending-client-selection? false
    :user nil
    :available-clients nil
    :logging-out? false
    :turns []
    :current-prompt ""}))

;; Submit prompt with meeting context
(rf/reg-event-fx
 :submit-meeting-prompt
 (fn [{:keys [db]} [_ prompt meeting-id]]
   ;; Similar to submit-prompt but with meeting context
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
                       :context response-context}})))

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

;; Meeting join/create events
(rf/reg-event-db
 :join-meeting
 (fn [db [_ meeting]]
   (assoc db :active-meeting meeting)))

(rf/reg-event-fx
 :create-new-meeting
 (fn [{:keys [db]} [_ meeting-name]]
   {:db (assoc db :creating-meeting? true)
    :http-xhrio {:method          :post
                 :uri             "/api/meetings/create"
                 :params          {:meeting_name meeting-name}
                 :format          (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success      [:meeting-created]
                 :on-failure      [:meeting-creation-failed]}}))

(rf/reg-event-fx
 :meeting-created
 (fn [{:keys [db]} [_ response]]
   {:db (-> db
            (assoc :creating-meeting? false)
            (assoc :active-meeting (assoc response :block_id (:meeting_id response))))
    :dispatch-n [[:cogito.meetings/load-meetings]
                 [:workbench/set-active-tab :conversation]]}))

(rf/reg-event-db
 :meeting-creation-failed
 (fn [db [_ error]]
   (assoc db :creating-meeting? false
             :meeting-creation-error error)))

(rf/reg-event-db
 :leave-meeting
 (fn [db _]
   (dissoc db :active-meeting)))

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

;; Daily Summary Events
(rf/reg-event-db
 :daily-summary/set-selected-date
 (fn [db [_ date]]
   (assoc-in db [:daily-summary :selected-date] date)))

(rf/reg-event-fx
 :daily-summary/set-selected-year
 (fn [{:keys [db]} [_ year]]
   (let [current-date (js/Date. (get-in db [:daily-summary :selected-date]))
         new-date (js/Date. year (.getMonth current-date) (.getDate current-date))]
     {:db (assoc-in db [:daily-summary :selected-date] (.toISOString new-date))
      :dispatch [:daily-summary/load-day]})))

(rf/reg-event-fx
 :daily-summary/set-selected-month
 (fn [{:keys [db]} [_ month]]
   (let [current-date (js/Date. (get-in db [:daily-summary :selected-date]))
         new-date (js/Date. (.getFullYear current-date) month (.getDate current-date))]
     {:db (assoc-in db [:daily-summary :selected-date] (.toISOString new-date))
      :dispatch [:daily-summary/load-day]})))

(rf/reg-event-db
 :daily-summary/set-loading
 (fn [db [_ loading?]]
   (assoc-in db [:daily-summary :loading?] loading?)))

(rf/reg-event-db
 :daily-summary/set-data
 (fn [db [_ data]]
   (assoc-in db [:daily-summary :data] data)))

(rf/reg-event-fx
 :daily-summary/load-day
 (fn [{:keys [db]} _]
   (let [selected-date (get-in db [:daily-summary :selected-date] 
                              (let [today (js/Date.)]
                                (.setHours today 0 0 0 0)
                                (.toISOString today)))]
     {:db (assoc-in db [:daily-summary :loading?] true)
      :http-xhrio {:method :get
                   :uri (str "/api/daily-summary/" (.substring selected-date 0 10))
                   :response-format (ajax/json-response-format {:keywords? true})
                   :on-success [:daily-summary/load-success]
                   :on-failure [:daily-summary/load-failure]}})))

(rf/reg-event-db
 :daily-summary/load-success
 (fn [db [_ response]]
   (-> db
       (assoc-in [:daily-summary :loading?] false)
       (assoc-in [:daily-summary :data] response))))

(rf/reg-event-db
 :daily-summary/load-failure
 (fn [db [_ error]]
   (-> db
       (assoc-in [:daily-summary :loading?] false)
       (assoc-in [:daily-summary :data] nil))))

(rf/reg-event-fx
 :daily-summary/previous-day
 (fn [{:keys [db]} _]
   (let [current-date (js/Date. (get-in db [:daily-summary :selected-date]))
         previous-date (js/Date. (.setDate current-date (dec (.getDate current-date))))]
     {:db (assoc-in db [:daily-summary :selected-date] (.toISOString previous-date))
      :dispatch [:daily-summary/load-day]})))

(rf/reg-event-fx
 :daily-summary/next-day
 (fn [{:keys [db]} _]
   (let [current-date (js/Date. (get-in db [:daily-summary :selected-date]))
         next-date (js/Date. (.setDate current-date (inc (.getDate current-date))))]
     {:db (assoc-in db [:daily-summary :selected-date] (.toISOString next-date))
      :dispatch [:daily-summary/load-day]})))

(rf/reg-event-fx
 :daily-summary/generate-summary
 (fn [{:keys [db]} _]
   (let [selected-date (get-in db [:daily-summary :selected-date])]
     {:db (assoc-in db [:daily-summary :summary :generating?] true)
      :http-xhrio {:method :post
                   :uri "/api/generate-daily-summary"
                   :params {:date (.substring selected-date 0 10)}
                   :format (ajax/json-request-format)
                   :response-format (ajax/json-response-format {:keywords? true})
                   :on-success [:daily-summary/summary-success]
                   :on-failure [:daily-summary/summary-failure]}})))

(rf/reg-event-db
 :daily-summary/summary-success
 (fn [db [_ response]]
   (-> db
       (assoc-in [:daily-summary :summary :generating?] false)
       (assoc-in [:daily-summary :summary :content] (:summary response)))))

(rf/reg-event-db
 :daily-summary/summary-failure
 (fn [db [_ error]]
   (-> db
       (assoc-in [:daily-summary :summary :generating?] false)
       (assoc-in [:daily-summary :summary :content] "Failed to generate summary. Please try again."))))

;; Monthly summary generation
(rf/reg-event-fx
 :daily-summary/generate-monthly-summaries
 (fn [{:keys [db]} [_ year month]]
   (let [target-year (or year (.getFullYear (js/Date.)))
         target-month (or month (.getMonth (js/Date.)))]
     {:db (assoc-in db [:daily-summary :monthly-summaries :generating?] true)
      :http-xhrio {:method :post
                   :uri "/api/generate-monthly-summaries"
                   :params {:year target-year :month target-month}
                   :format (ajax/json-request-format)
                   :response-format (ajax/json-response-format {:keywords? true})
                   :on-success [:daily-summary/monthly-summaries-success]
                   :on-failure [:daily-summary/monthly-summaries-failure]}})))

(rf/reg-event-db
 :daily-summary/monthly-summaries-success
 (fn [db [_ response]]
   (-> db
       (assoc-in [:daily-summary :monthly-summaries :generating?] false)
       (assoc-in [:daily-summary :monthly-summaries :data] (:summaries response))
       (assoc-in [:daily-summary :monthly-summaries :year] (:year response))
       (assoc-in [:daily-summary :monthly-summaries :month] (:month response)))))

(rf/reg-event-db
 :daily-summary/monthly-summaries-failure
 (fn [db [_ error]]
   (-> db
       (assoc-in [:daily-summary :monthly-summaries :generating?] false)
       (assoc-in [:daily-summary :monthly-summaries :data] nil))))

;; Monthly Summary Events (yearly summaries)
(rf/reg-event-fx
 :monthly-summary/generate-yearly-summaries
 (fn [{:keys [db]} [_ year]]
   (let [target-year (or year (.getFullYear (js/Date.)))]
     {:db (assoc-in db [:monthly-summary :yearly-summaries :generating?] true)
      :http-xhrio {:method :post
                   :uri "/api/generate-yearly-summaries"
                   :params {:year target-year}
                   :format (ajax/json-request-format)
                   :response-format (ajax/json-response-format {:keywords? true})
                   :on-success [:monthly-summary/yearly-summaries-success]
                   :on-failure [:monthly-summary/yearly-summaries-failure]}})))

(rf/reg-event-db
 :monthly-summary/yearly-summaries-success
 (fn [db [_ response]]
   (-> db
       (assoc-in [:monthly-summary :yearly-summaries :generating?] false)
       (assoc-in [:monthly-summary :yearly-summaries :data] (:summaries response))
       (assoc-in [:monthly-summary :yearly-summaries :year] (:year response)))))

(rf/reg-event-db
 :monthly-summary/yearly-summaries-failure
 (fn [db [_ error]]
   (-> db
       (assoc-in [:monthly-summary :yearly-summaries :generating?] false)
       (assoc-in [:monthly-summary :yearly-summaries :data] nil))))

;; Upload Files Events
(rf/reg-event-fx
 :upload-files/handle-files
 (fn [{:keys [db]} [_ file-list]]
   (let [files (array-seq file-list)]
     {:db (assoc-in db [:upload-files :uploading?] true)
      :upload-files-to-server {:files files}})))

(rf/reg-fx
 :upload-files-to-server
 (fn [{:keys [files]}]
   (doseq [file files]
     (let [form-data (js/FormData.)]
       (.append form-data "file" file)
       (-> (js/fetch "/api/upload-files/upload"
                     (clj->js {:method "POST"
                               :credentials "include"
                               :body form-data}))
           (.then #(.json %))
           (.then #(rf/dispatch [:upload-files/file-uploaded (js->clj % :keywordize-keys true)]))
           (.catch #(rf/dispatch [:upload-files/upload-failed (.-message %)])))))))

(rf/reg-event-fx
 :upload-files/file-uploaded
 (fn [{:keys [db]} [_ file-data]]
   {:db (assoc-in db [:upload-files :uploading?] false)
    :dispatch [:upload-files/load-files]}))

(rf/reg-event-db
 :upload-files/upload-failed
 (fn [db [_ error]]
   (-> db
       (assoc-in [:upload-files :uploading?] false)
       (assoc-in [:upload-files :error] error))))

(rf/reg-event-fx
 :upload-files/load-files
 (fn [{:keys [db]} _]
   {:http-xhrio {:method :get
                 :uri "/api/upload-files/files"
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:upload-files/files-loaded]
                 :on-failure [:upload-files/files-load-failed]}}))

(rf/reg-event-db
 :upload-files/files-loaded
 (fn [db [_ files]]
   (assoc-in db [:upload-files :files] files)))

(rf/reg-event-db
 :upload-files/files-load-failed
 (fn [db [_ error]]
   (assoc-in db [:upload-files :error] "Failed to load files")))

(rf/reg-event-fx
 :upload-files/select-file
 (fn [{:keys [db]} [_ file]]
   {:db (assoc-in db [:upload-files :selected-file] file)
    :http-xhrio {:method :get
                 :uri (str "/api/upload-files/files/" (:id file))
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:upload-files/file-content-loaded]
                 :on-failure [:upload-files/file-content-failed]}}))

(rf/reg-event-db
 :upload-files/file-content-loaded
 (fn [db [_ file-with-content]]
   (assoc-in db [:upload-files :selected-file] file-with-content)))

(rf/reg-event-db
 :upload-files/file-content-failed
 (fn [db [_ error]]
   (assoc-in db [:upload-files :content-error] "Failed to load file content")))

(rf/reg-event-fx
 :upload-files/delete-file
 (fn [{:keys [db]} [_ file-id]]
   {:db (assoc-in db [:upload-files :deleting file-id] true)
    :http-xhrio {:method :delete
                 :uri (str "/api/upload-files/files/" file-id)
                 :format (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:upload-files/file-deleted file-id]
                 :on-failure [:upload-files/delete-failed file-id]}}))

(rf/reg-event-fx
 :upload-files/file-deleted
 (fn [{:keys [db]} [_ file-id]]
   {:db (update-in db [:upload-files :deleting] dissoc file-id)
    :dispatch [:upload-files/load-files]}))

(rf/reg-event-db
 :upload-files/delete-failed
 (fn [db [_ file-id error]]
   (-> db
       (update-in [:upload-files :deleting] dissoc file-id)
       (assoc-in [:upload-files :error] "Failed to delete file"))))

;; Create text file event
(rf/reg-event-fx
 :upload-files/create-text-file
 (fn [{:keys [db]} [_ {:keys [title content]}]]
   {:db (assoc-in db [:upload-files :uploading?] true)
    :http-xhrio {:method :post
                 :uri "/api/upload-files/create-text"
                 :params {:title title :content content}
                 :format (ajax/json-request-format)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:upload-files/text-file-created]
                 :on-failure [:upload-files/text-file-failed]}}))

(rf/reg-event-fx
 :upload-files/text-file-created
 (fn [{:keys [db]} [_ file-data]]
   {:db (-> db
            (assoc-in [:upload-files :uploading?] false)
            (assoc-in [:upload-files :show-text-creator?] false)
            (assoc-in [:upload-files :selected-file] file-data))
    :dispatch [:upload-files/load-files]}))

(rf/reg-event-db
 :upload-files/text-file-failed
 (fn [db [_ error]]
   (-> db
       (assoc-in [:upload-files :uploading?] false)
       (assoc-in [:upload-files :error] "Failed to create text file"))))

;; Text creator form events
(rf/reg-event-db
 :upload-files/show-text-creator
 (fn [db [_]]
   (assoc-in db [:upload-files :show-text-creator?] true)))

(rf/reg-event-db
 :upload-files/hide-text-creator
 (fn [db [_]]
   (assoc-in db [:upload-files :show-text-creator?] false)))

;; Transcripts Events
(rf/reg-event-fx
 :transcripts/load-available-dates
 (fn [{:keys [db]} _]
   {:db (assoc-in db [:transcripts :loading-dates?] true)
    :http-xhrio {:method :get
                 :uri "/api/transcripts/dates"
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:transcripts/dates-loaded]
                 :on-failure [:transcripts/dates-load-failed]}}))

(rf/reg-event-db
 :transcripts/dates-loaded
 (fn [db [_ dates]]
   (-> db
       (assoc-in [:transcripts :loading-dates?] false)
       (assoc-in [:transcripts :available-dates] dates))))

(rf/reg-event-db
 :transcripts/dates-load-failed
 (fn [db [_ error]]
   (-> db
       (assoc-in [:transcripts :loading-dates?] false)
       (assoc-in [:transcripts :error] "Failed to load transcript dates"))))

(rf/reg-event-fx
 :transcripts/select-date
 (fn [{:keys [db]} [_ date]]
   {:db (-> db
            (assoc-in [:transcripts :selected-date] date)
            (assoc-in [:transcripts :loading-transcript?] true))
    :http-xhrio {:method :get
                 :uri (str "/api/transcripts/date/" date)
                 :response-format (ajax/json-response-format {:keywords? true})
                 :on-success [:transcripts/transcript-loaded]
                 :on-failure [:transcripts/transcript-load-failed]}}))

(rf/reg-event-db
 :transcripts/transcript-loaded
 (fn [db [_ transcript-data]]
   (-> db
       (assoc-in [:transcripts :loading-transcript?] false)
       (assoc-in [:transcripts :transcript-data] transcript-data))))

(rf/reg-event-db
 :transcripts/transcript-load-failed
 (fn [db [_ error]]
   (-> db
       (assoc-in [:transcripts :loading-transcript?] false)
       (assoc-in [:transcripts :error] "Failed to load transcript data"))))