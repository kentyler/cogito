(ns cogito.db)

(def default-db
  {:user nil
   :authenticated? false
   :conversation-id nil
   :turns []
   :current-prompt ""
   :loading? false
   :error nil
   :workbench/active-tab :conversation
   :alternative-indices {}})