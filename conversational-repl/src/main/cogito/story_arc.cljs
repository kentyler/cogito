(ns cogito.story-arc
  (:require [re-frame.core :as rf]
            [reagent.core :as r]))

(def sample-meeting-data
  "Real data from meeting jms-dxrf-ezk analysis"
  {:meeting-id "f3730dc1-550c-4886-ad9c-ace1aa07edca"
   :meeting-url "https://meet.google.com/jms-dxrf-ezk"
   :analysis-summary {:turns-analyzed 205
                     :coherence {:level "low" :score 0.34}
                     :flow-stability "dynamic"
                     :major-topic-shifts 61
                     :conversation-phases 62
                     :continuous-segments-percent 41.7}
   
   ;; Key story moments extracted from the analysis
   :story-arc {:narrative "A highly dynamic AI experimentation session with rapid topic exploration"
              :arc-type "experimental-exploration"
              :energy-level "high"}
   
   ;; Simplified phases grouped into story segments
   :story-segments 
   [{:segment-id 1
     :title "Opening & AI Introduction"
     :duration "~8 minutes"
     :phases [1 2 3 4 5 6 7]
     :turn-count 39
     :energy "building"
     :key-themes ["meeting setup" "AI greeting" "initial exploration"]
     :representative-content "Hello Ben! I'm Cogito, an AI assistant in this meeting."
     :significance "First contact with AI system"}
    
    {:segment-id 2
     :title "Rapid-Fire AI Testing"
     :duration "~15 minutes" 
     :phases [8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37]
     :turn-count 89
     :energy "peak"
     :key-themes ["personal questions to AI" "capability testing" "rapid topic switches"]
     :representative-content "hello cogito, what do you know about each of us in this meeting"
     :significance "Intensive AI interaction and testing phase"}
    
    {:segment-id 3
     :title "Technical Deep Dive"
     :duration "~12 minutes"
     :phases [38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54]
     :turn-count 61
     :energy "focused"
     :key-themes ["mathematical notation" "website sharing" "LLM licensing"]
     :representative-content "please use D` for 'D prime'"
     :significance "Shift to specific technical discussions"}
    
    {:segment-id 4
     :title "Structured Exercise Attempts" 
     :duration "~5 minutes"
     :phases [55 56 57 58 59 60 61 62]
     :turn-count 16
     :energy "organizing"
     :key-themes ["evaporating cloud exercise" "facilitation attempts" "structure introduction"]
     :representative-content "Thank you Karl. I'd be happy to facilitate an Evaporating Cloud exercise."
     :significance "AI attempting to provide structured facilitation"}]
   
   ;; Key moments that shaped the conversation
   :key-moments
   {:major-shifts 
    [{:turn "Hey. I'm gonna see if I can say hello to CC."
      :impact "Initiated AI interaction sequence"
      :similarity-drop 0.39
      :timestamp "early"}
     {:turn "yo, what do you know"
      :impact "Casual testing of AI capabilities" 
      :similarity-drop 0.27
      :timestamp "middle"}
     {:turn "please use D` for 'D prime'"
      :impact "Technical notation discussion"
      :similarity-drop 0.16
      :timestamp "late"}]
    
    :callbacks
    [{:turn "Thank you Karl. I'd be happy to facilitate an Evaporating Cloud exercise."
      :impact "AI returning to facilitation role"
      :connects-to "earlier facilitation attempts"}
     {:turn "did you get that"
      :impact "Checking communication/understanding"
      :connects-to "ongoing interaction patterns"}]
    
    :outliers
    [{:turn "please use D` for 'D prime'"
      :uniqueness 0.16
      :why "Highly specific mathematical notation"}
     {:turn "here is my website" 
      :uniqueness 0.16
      :why "Personal resource sharing"}
     {:turn "we want to discuss the licensing of LLMs or Not"
      :uniqueness 0.17
      :why "Legal/business topic emergence"}]}})

(defn energy-color [energy]
  (case energy
    "building" "#4ade80"   ; green
    "peak" "#f59e0b"       ; amber  
    "focused" "#3b82f6"    ; blue
    "organizing" "#8b5cf6" ; purple
    "#6b7280"))            ; gray default

(defn segment-card [segment]
  [:div.bg-white.rounded-lg.shadow-md.p-4.mb-4.border-l-4
   {:style {:border-left-color (energy-color (:energy segment))}}
   
   [:div.flex.justify-between.items-start.mb-2
    [:h3.text-lg.font-semibold.text-gray-800 (:title segment)]
    [:span.text-sm.text-gray-500 (:duration segment)]]
   
   [:div.flex.flex-wrap.gap-2.mb-3
    (for [theme (:key-themes segment)]
      ^{:key theme}
      [:span.px-2.py-1.bg-gray-100.text-gray-700.text-xs.rounded-full theme])]
   
   [:div.bg-gray-50.p-3.rounded.mb-3
    [:p.text-sm.italic.text-gray-600 
     "\"" (:representative-content segment) "\""]
    [:p.text-xs.text-gray-500.mt-1 
     "Significance: " (:significance segment)]]
   
   [:div.flex.justify-between.text-sm.text-gray-500
    [:span (str (:turn-count segment) " turns")]
    [:span (str "Phases " (first (:phases segment)) "-" (last (:phases segment)))]
    [:span.flex.items-center
     [:div.w-2.h-2.rounded-full.mr-1 {:style {:background-color (energy-color (:energy segment))}}]
     (str (:energy segment) " energy")]]])

(defn key-moment-badge [moment type]
  [:div.bg-blue-50.border.border-blue-200.rounded-lg.p-3.mb-2
   [:div.flex.justify-between.items-start.mb-1
    [:span.text-xs.font-medium.text-blue-600.uppercase type]
    (when (:similarity-drop moment)
      [:span.text-xs.text-gray-500 
       (str "Drop: " (:similarity-drop moment))])]
   
   [:p.text-sm.text-gray-700.mb-1 
    "\"" (:turn moment) "\""]
   
   [:p.text-xs.text-gray-600.italic (:impact moment)]
   
   (when (:connects-to moment)
     [:p.text-xs.text-blue-600.mt-1 
      "↳ " (:connects-to moment)])
   
   (when (:why moment)
     [:p.text-xs.text-orange-600.mt-1 
      "⚡ " (:why moment)])])

(defn story-arc-component []
  (let [data sample-meeting-data]
    [:div.max-w-4xl.mx-auto.p-6
     
     ;; Header
     [:div.bg-gradient-to-r.from-blue-500.to-purple-600.text-white.rounded-lg.p-6.mb-6
      [:h1.text-2xl.font-bold.mb-2 "Conversation Story Arc"]
      [:p.text-blue-100.mb-4 (:narrative (:story-arc data))]
      
      [:div.grid.grid-cols-2.md:grid-cols-4.gap-4.text-center
       [:div
        [:div.text-2xl.font-bold (get-in data [:analysis-summary :turns-analyzed])]
        [:div.text-sm.text-blue-200 "Turns"]]
       [:div  
        [:div.text-2xl.font-bold (get-in data [:analysis-summary :major-topic-shifts])]
        [:div.text-sm.text-blue-200 "Topic Shifts"]]
       [:div
        [:div.text-2xl.font-bold (get-in data [:analysis-summary :conversation-phases])]
        [:div.text-sm.text-blue-200 "Phases"]]
       [:div
        [:div.text-2xl.font-bold (str (get-in data [:analysis-summary :continuous-segments-percent]) "%")]
        [:div.text-sm.text-blue-200 "Continuous"]]]]
     
     ;; Story Timeline
     [:div.mb-8
      [:h2.text-xl.font-semibold.text-gray-800.mb-4 "Story Timeline"]
      (for [segment (:story-segments data)]
        ^{:key (:segment-id segment)}
        [segment-card segment])]
     
     ;; Key Moments
     [:div.grid.md:grid-cols-3.gap-6
      
      ;; Topic Shifts
      [:div
       [:h3.text-lg.font-semibold.text-gray-800.mb-3 "🔀 Major Topic Shifts"]
       (for [[idx moment] (map-indexed vector (get-in data [:key-moments :major-shifts]))]
         ^{:key idx}
         [key-moment-badge moment "topic shift"])]
      
      ;; Callbacks  
      [:div
       [:h3.text-lg.font-semibold.text-gray-800.mb-3 "🔄 Callback Moments"]
       (for [[idx moment] (map-indexed vector (get-in data [:key-moments :callbacks]))]
         ^{:key idx}
         [key-moment-badge moment "callback"])]
      
      ;; Outliers
      [:div
       [:h3.text-lg.font-semibold.text-gray-800.mb-3 "⚡ Unique Moments"]
       (for [[idx moment] (map-indexed vector (get-in data [:key-moments :outliers]))]
         ^{:key idx}
         [key-moment-badge moment "outlier"])]]
     
     ;; Conversation Insights
     [:div.bg-gray-50.rounded-lg.p-6.mt-8
      [:h3.text-lg.font-semibold.text-gray-800.mb-3 "📊 Conversation Insights"]
      [:div.grid.md:grid-cols-2.gap-4
       [:div
        [:h4.font-medium.text-gray-700.mb-2 "Flow Characteristics"]
        [:ul.text-sm.text-gray-600.space-y-1
         [:li (str "• Coherence: " (get-in data [:analysis-summary :coherence :level]) 
                  " (" (get-in data [:analysis-summary :coherence :score]) ")")]
         [:li (str "• Flow: " (get-in data [:analysis-summary :flow-stability]))]
         [:li (str "• Arc Type: " (get-in data [:story-arc :arc-type]))]]]
       
       [:div
        [:h4.font-medium.text-gray-700.mb-2 "Story Pattern"]
        [:p.text-sm.text-gray-600 
         "This conversation shows a classic \"experimental exploration\" pattern - "
         "participants actively testing AI capabilities with rapid topic switching, "
         "followed by attempts at structured facilitation. The high energy and low "
         "coherence indicate genuine curiosity-driven exploration rather than "
         "goal-directed discussion."]]]]]))

;; Re-frame events and subscriptions
(rf/reg-event-db
 :story-arc/set-selected-segment
 (fn [db [_ segment-id]]
   (assoc-in db [:story-arc :selected-segment] segment-id)))

(rf/reg-event-db  
 :story-arc/toggle-moment-details
 (fn [db [_ moment-id]]
   (update-in db [:story-arc :expanded-moments] 
              (fn [expanded] 
                (if (expanded moment-id)
                  (disj expanded moment-id)
                  (conj (or expanded #{}) moment-id))))))

(rf/reg-sub
 :story-arc/selected-segment
 (fn [db]
   (get-in db [:story-arc :selected-segment])))

(rf/reg-sub
 :story-arc/expanded-moments  
 (fn [db]
   (get-in db [:story-arc :expanded-moments] #{})))

(defn mount-component []
  [story-arc-component])