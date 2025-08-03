(ns cogito.text-file-creator
  (:require [reagent.core :as r]
            [re-frame.core :as rf]))

(defn text-file-creator []
  (let [uploading? (rf/subscribe [:upload-files/uploading?])
        show-text-input? (r/atom false)
        text-title (r/atom "")
        text-content (r/atom "")]
    (fn []
      [:div.mb-4
       [:button {:class "w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                 :on-click #(reset! show-text-input? true)
                 :disabled @uploading?}
        "Create Text File"]
       
       (when @show-text-input?
         [:div {:class "mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50"}
          [:div.mb-3
           [:label {:class "block text-sm font-medium text-gray-700 mb-1"} "Title"]
           [:input {:class "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :type "text"
                    :placeholder "Enter file title..."
                    :value @text-title
                    :on-change #(reset! text-title (-> % .-target .-value))}]]
          [:div.mb-3
           [:label {:class "block text-sm font-medium text-gray-700 mb-1"} "Content"]
           [:textarea {:class "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                       :placeholder "Paste your text content here..."
                       :rows 6
                       :value @text-content
                       :on-change #(reset! text-content (-> % .-target .-value))}]]
          [:div.flex.justify-end.space-x-2
           [:button {:class "px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                     :on-click #(do (reset! show-text-input? false)
                                  (reset! text-title "")
                                  (reset! text-content ""))}
            "Cancel"]
           [:button {:class "px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                     :on-click #(when (and (seq @text-title) (seq @text-content))
                                 (rf/dispatch [:upload-files/create-text-file 
                                             {:title @text-title
                                              :content @text-content}])
                                 (reset! show-text-input? false)
                                 (reset! text-title "")
                                 (reset! text-content ""))
                     :disabled (or (empty? @text-title) (empty? @text-content))}
            "Create File"]]]))))