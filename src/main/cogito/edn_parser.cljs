(ns cogito.edn-parser
  "Parser for EDN/ClojureScript data structures received from the backend"
  (:require [cljs.reader :as reader]
            [clojure.string :as str]))

(defn clean-response-string
  "Clean up the response string to make it valid EDN"
  [s]
  ;; Trim whitespace and ensure proper formatting
  (-> s
      (str/trim)
      ;; Fix common issues with string escaping
      (str/replace #"\\n" "\n")
      (str/replace #"\\t" "\t")))

(defn parse-cljs-response
  "Parse a ClojureScript/EDN response string into Clojure data.
   Falls back to a text response on parse errors."
  [response-str]
  (try
    ;; Log what we're trying to parse for debugging
    (js/console.log "EDN Parser: Starting to parse response")
    (js/console.log "EDN Parser Raw response length:" (count response-str))
    
    ;; Clean the response string
    (let [cleaned (clean-response-string response-str)]
      (js/console.log "EDN Parser: Cleaned response length:" (count cleaned))
      
      ;; Use the built-in EDN reader which handles all ClojureScript data types
      (let [parsed (reader/read-string cleaned)]
        (js/console.log "Successfully parsed:" (pr-str parsed))
        parsed))
    (catch js/Error e
      (js/console.error "Failed to parse EDN response:" response-str)
      (js/console.error "Parse error details:" (.-message e))
      (js/console.error "Error stack:" (.-stack e))
      
      ;; Try to extract just the data part if the response contains extra text
      (try
        (let [start-idx (.indexOf response-str "{")
              end-idx (.lastIndexOf response-str "}")]
          (if (and (>= start-idx 0) (> end-idx start-idx))
            (let [extracted (.substring response-str start-idx (inc end-idx))
                  cleaned (clean-response-string extracted)]
              (js/console.log "Trying extracted EDN:" cleaned)
              (reader/read-string cleaned))
            (throw e)))
        (catch js/Error e2
          (js/console.error "Extraction also failed:" (.-message e2))
          ;; Return a simple text response as fallback
          {:response-type :text
           :content response-str})))))