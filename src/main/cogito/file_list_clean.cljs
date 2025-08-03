(ns cogito.file-list
  (:require [re-frame.core :as rf]))

(defn file-list []
  (let [uploaded-files (rf/subscribe [:upload-files/files])
        selected-file (rf/subscribe [:upload-files/selected-file])]
    (fn []
      [:div.flex-1.overflow-y-auto
       [:h3.text-sm.font-medium.text-gray-700.mb-2 "Uploaded Files"]
       (if (and @uploaded-files (seq @uploaded-files))
         [:div.space-y-1
          (for [file @uploaded-files]
            ^{:key (:id file)}
            [:div {:class (str "p-2 rounded hover:bg-gray-100 cursor-pointer border transition-colors "
                              (if (= (:id file) (:id @selected-file)) 
                                "bg-blue-50 border-blue-200" 
                                "border-transparent"))
                   :on-click #(rf/dispatch [:upload-files/select-file file])}
             [:div.flex.justify-between.items-start
              [:div.flex-1
               [:div.flex.items-center.gap-2
                [:p.text-sm.font-medium.text-gray-900.truncate (:filename file)]
                (when (= "text-input" (:source_type file))
                  [:span {:class "text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"} "Text"])]
               [:p.text-xs.text-gray-500 
                (str (.toLocaleDateString (js/Date. (:uploaded_at file))) 
                     " • " (if (:size file) (str (Math.round (/ (:size file) 1024)) "KB") "")
                     " • " (:chunk_count file) " chunks")]]
              [:button {:class "ml-2 text-xs text-red-500 hover:text-red-700"
                        :on-click #(do (.stopPropagation %)
                                     (rf/dispatch [:upload-files/delete-file (:id file)]))}
               "×"]]])]
         [:p.text-sm.text-gray-500 "No files uploaded yet"])])))