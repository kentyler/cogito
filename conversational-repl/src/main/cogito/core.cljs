(ns cogito.core
  (:require [reagent.core :as r]
            [reagent.dom :as rdom]
            [re-frame.core :as rf]
            [cogito.workbench :as workbench]
            [cogito.login :as login]
            [cogito.client-selection :as client-selection]
            [cogito.story-arc :as story-arc]
            [cogito.meetings :as meetings]
            [cogito.events]
            [cogito.subs]
            [day8.re-frame.http-fx]))

(defn app []
  (let [authenticated? (rf/subscribe [:authenticated?])
        pending-client-selection? (rf/subscribe [:pending-client-selection?])]
    (fn []
      [:div.conversational-repl
       (cond
         @authenticated? [workbench/panel]
         @pending-client-selection? [client-selection/client-selection-form]
         :else [login/login-form])])))

(defn ^:dev/after-load mount-root []
  (rdom/render [app] (.getElementById js/document "app")))

(defn init! []
  (rf/dispatch-sync [:initialize-db])
  (rf/dispatch [:check-auth-status])
  (mount-root))