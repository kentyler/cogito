(ns cogito.upload-files-left-pane
  (:require [cogito.upload-file-area :as upload-area]
            [cogito.text-file-creator :as text-creator]
            [cogito.file-list :as file-list]))

(defn upload-files-left-pane []
  [:div {:class "flex flex-col h-full"}
   [:div.mb-4
    [:h2.text-xl.font-semibold.mb-2 "Upload Files"]
    [:p.text-sm.text-gray-600.mb-4 "Upload .txt and .md files for content analysis"]
    [upload-area/upload-file-area]]
   [text-creator/text-file-creator]
   [file-list/file-list]])