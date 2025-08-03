(ns cogito.text-file-creator
  (:require [reagent.core :as r]
            [re-frame.core :as rf]))

(defn- reset-form! [show-input? title content]
  (reset! show-input? false)
  (reset! title "")
  (reset! content ""))

(defn- submit-text-file! [title content show-input?]
  (when (and (seq @title) (seq @content))
    (rf/dispatch [:upload-files/create-text-file 
                  {:title @title :content @content}])
    (reset-form! show-input? title content)))

(defn- text-input-form [title content show-input?]
  [:div {:class "mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50"}
   [:div.mb-3
    [:label {:class "block text-sm font-medium text-gray-700 mb-1"} "Title"]
    [:input {:class "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
             :type "text"
             :placeholder "Enter file title..."
             :value @title
             :on-change #(reset! title (-> % .-target .-value))}]]
   
   [:div.mb-3
    [:label {:class "block text-sm font-medium text-gray-700 mb-1"} "Content"]
    [:textarea {:class "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                :placeholder "Paste your text content here..."
                :rows 6
                :value @content
                :on-change #(reset! content (-> % .-target .-value))}]]
   
   [:div.flex.justify-end.space-x-2
    [:button {:class "px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              :on-click #(reset-form! show-input? title content)}
     "Cancel"]
    [:button {:class "px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              :on-click #(submit-text-file! title content show-input?)
              :disabled (or (empty? @title) (empty? @content))}
     "Create File"]]])

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
         [text-input-form text-title text-content show-text-input?])]))))