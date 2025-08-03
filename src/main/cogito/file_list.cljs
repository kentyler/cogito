(ns cogito.file-list
  (:require [re-frame.core :as rf]))

(defn file-list []
  (let [files (rf/subscribe [:upload-files/files])
        selected (rf/subscribe [:upload-files/selected-file])]
    (fn []
      [:div.flex-1.overflow-y-auto
       [:h3 "Uploaded Files"]
       (if (seq @files)
         [:div
          (for [file @files]
            ^{:key (:id file)}
            [:div {:class (str "flex items-center justify-between p-2 rounded hover:bg-gray-100 " 
                                   (if (= (:id file) (:id @selected)) "bg-blue-50 border border-blue-200" ""))}
             [:button {:class "text-left text-blue-600 hover:text-blue-800 underline flex-1"
                       :on-click #(rf/dispatch [:upload-files/select-file file])}
              (:filename file)]
             [:button {:class "ml-2 text-red-500 hover:text-red-700 px-2 py-1"
                       :on-click #(do (.stopPropagation %) 
                                     (rf/dispatch [:upload-files/delete-file (:id file)]))} 
              "×"]])]
         [:p "No files uploaded yet"])])))