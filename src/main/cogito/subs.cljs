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
 :pending-client-selection?
 (fn [db]
   (:pending-client-selection? db)))

(rf/reg-sub
 :available-clients
 (fn [db]
   (:available-clients db)))

(rf/reg-sub
 :selecting-client?
 (fn [db]
   (:selecting-client? db)))

(rf/reg-sub
 :client-selection-error
 (fn [db]
   (:client-selection-error db)))

(rf/reg-sub
 :logging-out?
 (fn [db]
   (:logging-out? db)))

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

;; Active meeting subscriptions
(rf/reg-sub
 :active-meeting
 (fn [db]
   (:active-meeting db)))

(rf/reg-sub
 :creating-meeting?
 (fn [db]
   (:creating-meeting? db)))

(rf/reg-sub
 :meeting-creation-error
 (fn [db]
   (:meeting-creation-error db)))

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

;; Client switching subscriptions
(rf/reg-sub
 :available-clients
 (fn [db]
   (get db :available-clients [])))

(rf/reg-sub
 :current-client-id
 (fn [db]
   (get db :current-client-id)))

(rf/reg-sub
 :switching-client?
 (fn [db]
   (get db :switching-client? false)))

(rf/reg-sub
 :client-switch-error
 (fn [db]
   (get db :client-switch-error)))

(rf/reg-sub
 :available-clients-error
 (fn [db]
   (get db :available-clients-error)))

;; Daily Summary subscriptions
(rf/reg-sub
 :daily-summary/selected-date
 (fn [db]
   (get-in db [:daily-summary :selected-date] 
           (let [today (js/Date.)]
             (.setHours today 0 0 0 0)
             (.toISOString today)))))

(rf/reg-sub
 :daily-summary/selected-year
 (fn [db]
   (let [date-str (get-in db [:daily-summary :selected-date] 
                         (let [today (js/Date.)]
                           (.setHours today 0 0 0 0)
                           (.toISOString today)))]
     (.getFullYear (js/Date. date-str)))))

(rf/reg-sub
 :daily-summary/selected-month
 (fn [db]
   (let [date-str (get-in db [:daily-summary :selected-date] 
                         (let [today (js/Date.)]
                           (.setHours today 0 0 0 0)
                           (.toISOString today)))]
     (.getMonth (js/Date. date-str)))))

(rf/reg-sub
 :daily-summary/data
 (fn [db]
   (get-in db [:daily-summary :data])))

(rf/reg-sub
 :daily-summary/loading?
 (fn [db]
   (get-in db [:daily-summary :loading?] false)))

(rf/reg-sub
 :daily-summary/summary
 (fn [db]
   (get-in db [:daily-summary :summary])))

;; Monthly summaries subscriptions
(rf/reg-sub
 :daily-summary/monthly-summaries
 (fn [db]
   (get-in db [:daily-summary :monthly-summaries :data])))

(rf/reg-sub
 :daily-summary/monthly-summaries-generating?
 (fn [db]
   (get-in db [:daily-summary :monthly-summaries :generating?] false)))

(rf/reg-sub
 :daily-summary/current-day-summary
 (fn [db]
   (let [selected-date (get-in db [:daily-summary :selected-date]
                              (let [today (js/Date.)]
                                (.setHours today 0 0 0 0)
                                (.toISOString today)))
         date-key (.substring selected-date 0 10)
         monthly-summaries (get-in db [:daily-summary :monthly-summaries :data])]
     (get monthly-summaries date-key))))

;; Monthly Summary subscriptions (yearly summaries)
(rf/reg-sub
 :monthly-summary/yearly-summaries
 (fn [db]
   (get-in db [:monthly-summary :yearly-summaries :data])))

(rf/reg-sub
 :monthly-summary/yearly-summaries-generating?
 (fn [db]
   (get-in db [:monthly-summary :yearly-summaries :generating?] false)))

;; Upload Files subscriptions
(rf/reg-sub
 :upload-files/files
 (fn [db]
   (get-in db [:upload-files :files] [])))

(rf/reg-sub
 :upload-files/selected-file
 (fn [db]
   (get-in db [:upload-files :selected-file])))

(rf/reg-sub
 :upload-files/uploading?
 (fn [db]
   (get-in db [:upload-files :uploading?] false)))

(rf/reg-sub
 :upload-files/show-text-creator?
 (fn [db]
   (get-in db [:upload-files :show-text-creator?] false)))

;; Transcripts subscriptions
(rf/reg-sub
 :transcripts/available-dates
 (fn [db]
   (get-in db [:transcripts :available-dates] [])))

(rf/reg-sub
 :transcripts/selected-date
 (fn [db]
   (get-in db [:transcripts :selected-date])))

(rf/reg-sub
 :transcripts/transcript-data
 (fn [db]
   (get-in db [:transcripts :transcript-data] [])))

(rf/reg-sub
 :transcripts/loading-dates?
 (fn [db]
   (get-in db [:transcripts :loading-dates?] false)))

(rf/reg-sub
 :transcripts/loading-transcript?
 (fn [db]
   (get-in db [:transcripts :loading-transcript?] false)))