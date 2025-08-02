(ns cogito.logout-button
  (:require [re-frame.core :as rf]))

(defn logout-button []
  (let [logging-out? (rf/subscribe [:logging-out?])]
    (fn []
      [:button.px-3.py-1.text-sm.bg-red-500.text-white.rounded.hover:bg-red-600.disabled:opacity-50
       {:on-click #(rf/dispatch [:logout])
        :disabled @logging-out?}
       (if @logging-out? "Logging out..." "Logout")])))