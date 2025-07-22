(ns cogito.core
  (:require [reagent.core :as r]
            [reagent.dom :as rdom]
            [re-frame.core :as rf]
            [cogito.workbench :as workbench]
            [cogito.login :as login]
            [cogito.story-arc :as story-arc]
            [cogito.meetings :as meetings]
            [cogito.events]
            [cogito.subs]
            [day8.re-frame.http-fx]))

(defn app []
  (let [authenticated? (rf/subscribe [:authenticated?])]
    (fn []
      [:div.conversational-repl
       (if @authenticated?
         [workbench/panel]
         [login/login-form])])))

(defn ^:dev/after-load mount-root []
  (rdom/render [app] (.getElementById js/document "app")))

(defn init! []
  (rf/dispatch-sync [:initialize-db])
  (rf/dispatch [:check-auth-status])
  (mount-root))