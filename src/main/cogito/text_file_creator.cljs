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
                 :on-click #(reset! show-input? true)
                 :disabled @uploading?}
        "Create Text File"]
       (when @show-input?
         [:div {:class "mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50"}
          [:input {:placeholder "Title" :value @title :on-change #(reset! title (-> % .-target .-value))}]
          [:textarea {:placeholder "Content" :value @content :on-change #(reset! content (-> % .-target .-value))}]
          [:button {:on-click #(do (reset! show-input? false) (reset! title "") (reset! content ""))} "Cancel"]
          [:button {:on-click #(rf/dispatch [:upload-files/create-text-file {:title @title :content @content}])} "Create"]])])))