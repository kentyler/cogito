(ns cogito.cljs-parser
  "Parser for ClojureScript data structures received as strings from the backend.
   Converts ClojureScript syntax to JavaScript objects that can be used by reagent.")

(defn parse-keyword
  "Convert :keyword string to keyword"
  [s]
  (when (and (string? s) (= (first s) ":"))
    (keyword (subs s 1))))

(defn parse-string
  "Parse a quoted string, handling escaped quotes"
  [s start-pos]
  (loop [pos (inc start-pos)
         result ""
         escaped? false]
    (if (>= pos (count s))
      [result pos]
      (let [ch (nth s pos)]
        (cond
          escaped? (recur (inc pos) (str result ch) false)
          (= ch \\) (recur (inc pos) result true)
          (= ch \") [result (inc pos)]
          :else (recur (inc pos) (str result ch) false))))))

(defn skip-whitespace
  "Skip whitespace and return new position"
  [s pos]
  (loop [p pos]
    (if (and (< p (count s)) 
             (contains? #{\space \tab \newline \return} (nth s p)))
      (recur (inc p))
      p)))

(declare parse-value)

(defn parse-vector
  "Parse a vector [...] and return [parsed-vector new-pos]"
  [s start-pos]
  (loop [pos (inc start-pos)
         result []]
    (let [pos (skip-whitespace s pos)]
      (if (>= pos (count s))
        [result pos]
        (case (nth s pos)
          \] [(vec result) (inc pos)]
          (let [[value new-pos] (parse-value s pos)]
            (if value
              (recur new-pos (conj result value))
              (recur new-pos result))))))))

(defn parse-map
  "Parse a map {...} and return [parsed-map new-pos]"
  [s start-pos]
  (loop [pos (inc start-pos)
         result {}]
    (let [pos (skip-whitespace s pos)]
      (if (>= pos (count s))
        [result pos]
        (case (nth s pos)
          \} [result (inc pos)]
          (let [[key key-pos] (parse-value s pos)
                key-pos (skip-whitespace s key-pos)
                [val val-pos] (parse-value s key-pos)]
            (recur val-pos (assoc result key val))))))))

(defn parse-symbol-or-keyword
  "Parse a symbol or keyword starting at pos"
  [s pos]
  (let [start pos
        keyword? (= (nth s pos) \:)]
    (loop [p (if keyword? (inc pos) pos)]
      (if (or (>= p (count s))
              (contains? #{\space \tab \newline \return \[ \] \{ \} \" \:} (nth s p)))
        (let [text (subs s start p)]
          (cond
            (= text "") [nil p]
            keyword? [(keyword (subs text 1)) p]
            :else [text p]))
        (recur (inc p))))))

(defn parse-value
  "Parse any value starting at position pos"
  [s pos]
  (let [pos (skip-whitespace s pos)]
    (if (>= pos (count s))
      [nil pos]
      (case (nth s pos)
        \{ (parse-map s pos)
        \[ (parse-vector s pos)
        \" (parse-string s pos)
        \: (parse-symbol-or-keyword s pos)
        ;; Default: parse as symbol/text until whitespace or delimiter
        (parse-symbol-or-keyword s pos)))))

(defn parse-cljs-data
  "Parse a ClojureScript data structure string into Clojure data"
  [s]
  (try
    (let [[result _] (parse-value s 0)]
      result)
    (catch js/Error e
      (js/console.error "Failed to parse ClojureScript data:" s e)
      ;; Return a simple text response as fallback
      {:response-type :text
       :content (str "Failed to parse response: " s)})))