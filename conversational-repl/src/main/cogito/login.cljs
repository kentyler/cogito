(ns cogito.login
  (:require [reagent.core :as r]
            [re-frame.core :as rf]))

(defn login-form []
  (let [email (r/atom "")
        password (r/atom "")
        error (r/atom nil)
        loading? (r/atom false)]
    (fn []
      [:div.login-form
       [:h2 "Login to Conversational REPL"]
       (when @error
         [:div.error-message @error])
       [:form
        {:on-submit (fn [e]
                      (.preventDefault e)
                      (reset! loading? true)
                      (reset! error nil)
                      (-> (js/fetch "/api/login"
                                    (clj->js {:method "POST"
                                              :headers {"Content-Type" "application/json"}
                                              :credentials "include"
                                              :body (js/JSON.stringify
                                                     (clj->js {:email @email
                                                              :password @password}))}))
                          (.then (fn [resp]
                                   (if (.-ok resp)
                                     (.json resp)
                                     (throw (js/Error. "Login failed")))))
                          (.then (fn [data]
                                   (reset! loading? false)
                                   (rf/dispatch [:login-success (js->clj data :keywordize-keys true)])))
                          (.catch (fn [err]
                                    (reset! loading? false)
                                    (reset! error "Invalid credentials")))))}
        [:div.form-group
         [:label "Email:"]
         [:input {:type "email"
                  :value @email
                  :on-change #(reset! email (-> % .-target .-value))
                  :required true
                  :disabled @loading?}]]
        [:div.form-group
         [:label "Password:"]
         [:input {:type "password"
                  :value @password
                  :on-change #(reset! password (-> % .-target .-value))
                  :required true
                  :disabled @loading?}]]
        [:button {:type "submit"
                  :disabled @loading?}
         (if @loading? "Logging in..." "Login")]]])))