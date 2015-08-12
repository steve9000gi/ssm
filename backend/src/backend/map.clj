(ns backend.map
  (:refer-clojure :exclude [list])
  (:require
    [clojure.java.io :as io]
    [clojure.java.jdbc :as jdbc]
    [reloaded.repl :refer [system]]
    [ring.util.http-response :as resp]
    [backend.postgres :refer [insert! query]]
    [cheshire.core :refer [generate-string parse-string parse-stream]]
    )
  (:import org.postgresql.util.PGobject))

(defn- try-parse-document
  [doc]
  (try
    (parse-stream (io/reader doc))
    (catch Exception e false)))

(defn- result->response
  [result]
  (let [doc (-> result :document .getValue parse-string)]
    (assoc result :document doc)))

(defn create
  [owner-id document]
  {:pre [(integer? owner-id)
         (pos? owner-id)]}
  (prn 'map/create owner-id document)
  (if-let [document (try-parse-document document)]
    (try
      (prn 'document document)
      (let [new-map (insert!
                      (:db system)
                      "ssm.maps"
                      {:owner owner-id,
                       :document (doto (PGobject.)
                                   (.setType "jsonb")
                                   (.setValue (generate-string document)))})]
        (if new-map
          (resp/ok (result->response (first new-map)))
          (resp/bad-request {:message "unknown error"
                             :data new-map})))
      (catch Exception e
        (println "Exception" e)
        (.printStackTrace e)
        (resp/internal-server-error {:message (.getMessage e)})))
    (resp/bad-request {:message "invalid map document"})))

(defn list
  [owner-id]
  {:pre [(integer? owner-id)
         (pos? owner-id)]}
  (prn 'map/list owner-id)
  (try
    (let [maps (query (:db system)
                      [(str "SELECT *"
                            "  FROM ssm.maps"
                            "  WHERE owner = ?")
                       owner-id])]
      (if-not maps
        (resp/internal-server-error
          {:message "false value returned from database"})
        (resp/ok (mapv result->response maps))))))

(defn fetch
  [owner-id id]
  {:pre [(integer? owner-id)
         (pos? owner-id)]}
  (prn 'map/fetch {:owner-id owner-id, :map-id id})
  (let [map-id (try
                 (Integer/parseInt id)
                 (catch NumberFormatException e nil))]
    (if (or (nil? map-id)
            (not (pos? map-id)))
      (resp/bad-request {:message (str "invalid map ID: " (pr-str id))})
      (let [map (first
                  (query (:db system)
                         [(str "SELECT *"
                               "  FROM ssm.maps"
                               "  WHERE id = ?")
                          map-id]))]
        (if-not map
          (resp/not-found {:message (format "map ID %d not found" map-id)})
          (if (not= owner-id (:owner map))
            (resp/forbidden {:message "map not owned by authenticated user"})
            (resp/ok (result->response map))))))))

