(ns cogito.file-list
  (:require [re-frame.core :as rf]))

(defn- format-file-size [size]
  (if size 
    (str (Math.round (/ size 1024)) "KB") 
    ""))

(defn- format-file-date [date-str]
  (.toLocaleDateString (js/Date. date-str)))

(defn- file-info-text [file]
  (let [date (format-file-date (:uploaded_at file))
        size (format-file-size (:size file))
        chunks (:chunk_count file)]
    (str date " • " size " • " chunks " chunks")))

(defn- is-selected? [file selected-file]
  (= (:id file) (:id @selected-file)))

(defn- file-item-classes [file selected-file]
  (str "p-2 rounded hover:bg-gray-100 cursor-pointer border transition-colors "
       (if (is-selected? file selected-file)
         "bg-blue-50 border-blue-200"
         "border-transparent")))

(defn- delete-file! [file]
  #(do (.stopPropagation %)
       (rf/dispatch [:upload-files/delete-file (:id file)])))

(defn- text-badge []
  [:span {:class "text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"} "Text"])

(defn- file-item [file selected-file]
  [:div {:class (file-item-classes file selected-file)
         :on-click #(rf/dispatch [:upload-files/select-file file])}
   [:div.flex.justify-between.items-start
    [:div.flex-1
     [:div.flex.items-center.gap-2
      [:p.text-sm.font-medium.text-gray-900.truncate (:filename file)]
      (when (= "text-input" (:source_type file))
        [text-badge])]
     [:p.text-xs.text-gray-500 (file-info-text file)]]
    [:button {:class "ml-2 text-xs text-red-500 hover:text-red-700"
              :on-click (delete-file! file)}
     "×"]]])

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
            [file-item file selected-file])]
         [:p.text-sm.text-gray-500 "No files uploaded yet"])]))))