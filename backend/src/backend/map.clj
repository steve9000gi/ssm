(ns backend.map
  (:refer-clojure :exclude [list update])
  (:require
    [clojure.java.io :as io]
    [clojure.java.jdbc :as jdbc]
    [reloaded.repl :refer [system]]
    [ring.util.http-response :as resp]
    [backend.postgres :refer [insert! update! query]]
    [backend.user :as user]
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

(defn- internal-fetch
  [id]
  (first
    (query (:db system)
           [(str "SELECT *"
                 "  FROM ssm.maps"
                 "  WHERE id = ?")
            id])))

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
    (let [sql (str "SELECT id, owner, created_at,"
                   "       jsonb_array_length(document #> '{nodes}')"
                   "         AS num_nodes,"
                   "       jsonb_array_length(document #> '{links}')"
                   "         AS num_links"
                   "  FROM ssm.maps")
          sql (if (user/is-admin? owner-id)
                [sql]
                [(str sql " WHERE owner = ?") owner-id])
          maps (query (:db system) sql)]
      (if-not maps
        (resp/internal-server-error
          {:message "false value returned from database"})
        (resp/ok (mapv #(dissoc % :document) maps))))))

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
      (let [map (internal-fetch map-id)]
        (if-not map
          (resp/not-found {:message (format "map ID %d not found" map-id)})
          (if (not= owner-id (:owner map))
            (resp/forbidden {:message "map not owned by authenticated user"})
            (resp/ok (result->response map))))))))

(defn update
  [owner-id id document]
  {:pre [(integer? owner-id)
         (pos? owner-id)]}
  (prn 'map/update {:owner-id owner-id, :map-id id})
  (let [map-id (try
                 (Integer/parseInt id)
                 (catch NumberFormatException e nil))]
    (if (or (nil? map-id)
            (not (pos? map-id)))
      (resp/bad-request {:message (str "invalid map ID: " (pr-str id))})
      (if (not= owner-id (-> map-id internal-fetch :owner))
        (resp/forbidden {:message "map not owned by authenticated user"})
        (if-let [document (try-parse-document document)]
          (let [[updated] (update! (:db system)
                                 "ssm.maps"
                                 {:document (doto (PGobject.)
                                              (.setType "jsonb")
                                              (.setValue
                                                (generate-string document)))}
                                 ["id = ?" map-id])]
            (if (= 1 updated)
              (resp/ok (result->response (internal-fetch map-id)))
              (resp/bad-request {:message "document did not save"})))
          (resp/bad-request {:message "invalid map document"}))))))

