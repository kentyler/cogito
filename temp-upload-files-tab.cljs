(defn upload-files-tab []
  (let [uploaded-files (rf/subscribe [:upload-files/files])
        selected-file (rf/subscribe [:upload-files/selected-file])
        uploading? (rf/subscribe [:upload-files/uploading?])
        show-text-input? (r/atom false)
        text-title (r/atom "")
        text-content (r/atom "")]
    ;; Load files on mount
    (when (empty? @uploaded-files)
      (rf/dispatch [:upload-files/load-files]))
    (fn []
      [:div.upload-files-tab.h-full.flex
       ;; Left pane - file upload and list
       [:div {:class "w-1/3 border-r border-gray-200 p-4 flex flex-col"}
        [:div.mb-4
         [:h2.text-xl.font-semibold.mb-2 "Upload Files"]
         [:p.text-sm.text-gray-600.mb-4 "Upload .txt and .md files for content analysis"]
         
         ;; File upload area
         [:div {:class (str "border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors" 
                           (when @uploading? " opacity-50"))}
          [:input.hidden
           {:type "file"
            :id "file-upload"
            :accept ".txt,.md"
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
               [:svg.mx-auto.h-8.w-8.text-gray-400 {:fill "none" :viewBox "0 0 24 24" :stroke "currentColor"}
                [:path {:stroke-linecap "round" :stroke-linejoin "round" :stroke-width "2" 
                        :d "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"}]]
               [:p.mt-2.text-sm "Click to upload files or drag and drop"]
               [:p.text-xs.text-gray-400 "TXT and MD files only"]])]]]
        
        ;; Create text file section
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
              "Create File"]]])]
        
        ;; File list
        [:div.flex-1.overflow-y-auto
         [:h3.text-sm.font-medium.text-gray-700.mb-2 "Uploaded Files"]
         (if (and @uploaded-files (seq @uploaded-files))
           [:div.space-y-1
            (for [file @uploaded-files]
              ^{:key (:id file)}
              [:div {:class "p-2 rounded hover:bg-gray-100 cursor-pointer border transition-colors"
                     :class (if (= (:id file) (:id @selected-file)) 
                              "bg-blue-50 border-blue-200" 
                              "border-transparent")
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
           [:p.text-sm.text-gray-500 "No files uploaded yet"])]]
       
       ;; Right pane - file content display
       [:div.flex-1.p-4.overflow-y-auto
        (if @selected-file
          [:div
           [:div.mb-4.pb-4.border-b.border-gray-200
            [:h3.text-lg.font-semibold.text-gray-900 (:filename @selected-file)]
            [:p.text-sm.text-gray-500 
             (str "Uploaded: " (.toLocaleDateString (js/Date. (:uploaded_at @selected-file)))
                  " • " (if (:size @selected-file) (str (Math.round (/ (:size @selected-file) 1024)) "KB") ""))]]
           [:div {:class "bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap overflow-auto"}
            (:content @selected-file)]]
          [:div {:class "flex items-center justify-center h-full text-gray-500"}
           [:div.text-center
            [:p.text-lg.mb-2 "No file selected"]
            [:p.text-sm "Select a file from the left panel to view its content"]]])]])))