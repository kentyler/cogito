(ns cogito.upload-file-area
  (:require [re-frame.core :as rf]))

(defn upload-file-area []
  (let [uploading? (rf/subscribe [:upload-files/uploading?])]
    (fn []
      [:div {:class (str "border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors" 
                        (when @uploading? " opacity-50"))}
       [:input.hidden
        {:type "file"
         :id "file-upload"
         :accept ".txt,.md,.pdf"
         :multiple true
         :disabled @uploading?
         :on-change #(rf/dispatch [:upload-files/handle-files (-> % .-target .-files)])}]
       [:label.cursor-pointer.block
        {:for "file-upload"}
        [:div.text-gray-500
         (if @uploading?
           [:div.flex.items-center.justify-center
            [:div.animate-spin.rounded-full.h-5.w-5.border-b-2.border-blue-600.mr-2]
            [:span "Uploading..."]]
           [:div
            [:p.text-sm "Click to upload files or drag and drop"]
            [:p.text-xs.text-gray-400 "TXT, MD and PDF files only"]])]]])))