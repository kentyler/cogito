(ns cogito.text-file-creator
  (:require [reagent.core :as r]
            [re-frame.core :as rf]))

(defn text-file-creator []
  (let [uploading? (rf/subscribe [:upload-files/uploading?])
        show-input? (r/atom false)
        title (r/atom "")
        content (r/atom "")]
    (fn []
      [:div.mb-4
       [:button {:class "w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                 :on-click #(rf/dispatch [:upload-files/show-text-creator])
                 :disabled @uploading?}
        "Create Text File"]
])))