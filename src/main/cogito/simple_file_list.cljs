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
            [:div {:class (if (= (:id file) (:id @selected)) "selected" "")
                   :on-click #(rf/dispatch [:upload-files/select-file file])}
             [:span (:filename file)]
             [:button {:on-click #(rf/dispatch [:upload-files/delete-file (:id file)])} "×"]])]
         [:p "No files uploaded yet"])]))))