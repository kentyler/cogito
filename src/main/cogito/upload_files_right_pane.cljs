(ns cogito.upload-files-right-pane
  (:require [re-frame.core :as rf]
            [reagent.core :as r]))

(defn text-creator-form []
  (let [title (r/atom "")
        content (r/atom "")]
    (fn []
      [:div.p-4
       [:div.mb-4.pb-4.border-b.border-gray-200
        [:h3.text-lg.font-semibold.text-gray-900 "Create New Text File"]
        [:p.text-sm.text-gray-500 "Enter a filename and paste your content below"]]
       
       [:div.mb-4
        [:label.block.text-sm.font-medium.text-gray-700.mb-2 "Filename"]
        [:input {:class "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 :type "text"
                 :placeholder "Enter filename (e.g., my-document.txt)"
                 :value @title
                 :on-change #(reset! title (-> % .-target .-value))}]]
       
       [:div.mb-4
        [:label.block.text-sm.font-medium.text-gray-700.mb-2 "Content"]
        [:textarea {:class "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    :placeholder "Paste your text content here..."
                    :rows 20
                    :value @content
                    :on-change #(reset! content (-> % .-target .-value))}]]
       
       [:div.flex.justify-end.space-x-3
        [:button {:class "px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
                  :on-click #(rf/dispatch [:upload-files/hide-text-creator])}
         "Cancel"]
        [:button {:class "px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                  :on-click #(when (and (seq @title) (seq @content))
                              (rf/dispatch [:upload-files/create-text-file {:title @title :content @content}]))
                  :disabled (or (empty? @title) (empty? @content))}
         "Create File"]]])))

(defn upload-files-right-pane []
  (let [selected-file (rf/subscribe [:upload-files/selected-file])
        show-text-creator (rf/subscribe [:upload-files/show-text-creator?])]
    (fn []
      [:div.h-full.overflow-y-auto
       (cond
         @show-text-creator
         [text-creator-form]
         
         @selected-file
         [:div
          [:div.mb-4.pb-4.border-b.border-gray-200
           [:h3.text-lg.font-semibold.text-gray-900 (:filename @selected-file)]
           [:p.text-sm.text-gray-500 
            (str "Uploaded: " (.toLocaleDateString (js/Date. (:uploaded_at @selected-file)))
                 " • " (if (:size @selected-file) (str (js/Math.round (/ (:size @selected-file) 1024)) "KB") ""))]]
          [:div {:class "bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap overflow-auto"}
           (:content @selected-file)]]
         
         :else
         [:div {:class "flex items-center justify-center h-full text-gray-500"}
          [:div.text-center
           [:p.text-lg.mb-2 "No file selected"]
           [:p.text-sm "Select a file from the left panel to view its content"]]])])))