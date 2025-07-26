(ns cogito.utils
  (:require [clojure.string :as str]))

;; Common utility functions for the Cogito application

(defn format-timestamp [timestamp]
  "Format a timestamp string into a human-readable date/time"
  (when timestamp
    (let [date (js/Date. timestamp)]
      (.toLocaleDateString date "en-US"
                          #js {:year "numeric"
                               :month "short"
                               :day "numeric"
                               :hour "2-digit"
                               :minute "2-digit"}))))

(defn truncate-string [s max-length]
  "Truncate a string to a maximum length with ellipsis"
  (if (> (count s) max-length)
    (str (subs s 0 max-length) "...")
    s))

(defn kebab-case [s]
  "Convert a string to kebab-case"
  (-> s
      (str/lower-case)
      (str/replace #"[^a-z0-9]+" "-")
      (str/replace #"^-|-$" "")))

(defn pluralize [n singular plural]
  "Return singular or plural form based on count"
  (if (= n 1) singular plural))

(defn percentage [numerator denominator]
  "Calculate percentage with safe division"
  (if (and denominator (> denominator 0))
    (* 100 (/ numerator denominator))
    0))

(defn format-duration [start-time end-time]
  "Format duration between two timestamps"
  (when (and start-time end-time)
    (let [start (js/Date. start-time)
          end (js/Date. end-time)
          diff-ms (- (.getTime end) (.getTime start))
          diff-minutes (Math/round (/ diff-ms 60000))]
      (cond
        (>= diff-minutes 1440) ; 24 hours
        (let [days (Math/floor (/ diff-minutes 1440))
              hours (Math/floor (/ (mod diff-minutes 1440) 60))]
          (str days "d " hours "h"))
        
        (>= diff-minutes 60)
        (let [hours (Math/floor (/ diff-minutes 60))
              minutes (mod diff-minutes 60)]
          (str hours "h " minutes "m"))
        
        :else
        (str diff-minutes "m")))))