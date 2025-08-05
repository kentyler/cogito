(ns cogito.invitations.list
  (:require [re-frame.core :as rf]))

(defn pending-invitations []
  (fn []
    (let [loading @(rf/subscribe [:invitations/loading])
          invitations @(rf/subscribe [:invitations/pending])
         ]
      [:div
       [:h3.text-lg.font-semibold.mb-4 "Pending Invitations"]
       (cond
         loading
         [:div.text-gray-500 "Loading..."]
         
         (empty? invitations)
         [:div.text-gray-500 "No pending invitations"]
         
         :else
         [:div.space-y-2
          (for [invitation invitations]
            ^{:key (:id invitation)}
            [:div.p-3.border.rounded
             [:div.font-medium (:email invitation)]
             [:div.text-sm.text-gray-600
              (str "Invited by " (:invited_by invitation)
                   " on " (.toLocaleDateString (js/Date. (:invited_at invitation)))
              )
             ]
            ]
          )
         ]
       )
      ]
    )
  )
)