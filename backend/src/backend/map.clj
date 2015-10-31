(ns backend.map
  (:refer-clojure :exclude [list update])
  (:require
    [clojure.java.io :as io]
    [clojure.java.jdbc :as jdbc]
    [reloaded.repl :refer [system]]
    [ring.util.http-response :as resp]
    [backend.postgres :refer [insert! update! delete! query]]
    [backend.user :as user]
    [cheshire.core :refer [generate-string parse-string parse-stream]]
    )
  (:import
    org.postgresql.util.PGobject
    java.util.Date
    java.sql.Timestamp))

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

(defn- set-default-name
  [id]
  (update! (:db system)
           "ssm.maps"
           {:name (str "map #" id)}
           ["id = ?" id]))

(defn create
  [owner-id document]
  {:pre [(integer? owner-id)
         (pos? owner-id)]}
  (prn 'map/create owner-id)
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
          (resp/ok (let [new-map (first new-map)]
                     (set-default-name (:id new-map))
                     (result->response new-map)))
          (resp/bad-request {:message "unknown error"
                             :data new-map})))
      (catch Exception e
        (println "Exception" e)
        (.printStackTrace e)
        (resp/internal-server-error {:message (.getMessage e)})))
    (resp/bad-request {:message "invalid map document"})))

(defn- list-as-admin-sql
  []
  [(str "SELECT m.id, name, owner, u.email AS owner_email, "
        "       created_at, modified_at,"
        "       jsonb_array_length(document #> '{nodes}') AS num_nodes,"
        "       jsonb_array_length(document #> '{links}') AS num_links"
        "  FROM ssm.maps m"
        "  JOIN ssm.users u"
        "    ON m.owner = u.id"
        "  ORDER BY modified_at DESC")])

(defn- list-as-user-sql
  [user-id]
  [(str "SELECT id, name, owner, created_at, modified_at,"
        "       jsonb_array_length(document #> '{nodes}') AS num_nodes,"
        "       jsonb_array_length(document #> '{links}') AS num_links"
        "  FROM ssm.maps"
        "  WHERE owner = ?"
        "  ORDER BY modified_at DESC")
   user-id])

(defn list
  [owner-id]
  {:pre [(integer? owner-id)
         (pos? owner-id)]}
  (prn 'map/list owner-id)
  (try
    (let [sql (if (user/is-admin? owner-id)
                (list-as-admin-sql)
                (list-as-user-sql owner-id))
          maps (query (:db system) sql)]
      (if-not maps
        (resp/internal-server-error
          {:message "false value returned from database"})
        (resp/ok (mapv #(dissoc % :document) maps))))
    (catch Exception e
      (println "Exception" e)
      (.printStackTrace e)
      (resp/internal-server-error {:message (.getMessage e)}))))

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
          (if (and (not= owner-id (:owner map))
                   (not (user/is-admin? owner-id)))
            (resp/forbidden {:message "map not owned by authenticated user"})
            (resp/ok (result->response map))))))))

(defn rename
  [owner-id id body]
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
        (if-let [new-name (get (try-parse-document body) "name")]
          (let [[updated] (update! (:db system)
                                   "ssm.maps"
                                   {:name new-name}
                                   ["id = ?" map-id])]
            (if (= 1 updated)
              (resp/ok {:name new-name})
              (resp/bad-request {:message "document did not save"})))
          (resp/bad-request
           {:message "invalid body; specify 'name' as the only property"}))))))

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
                                                  (generate-string document)))
                                    :modified_at (-> (Date.)
                                                     .getTime
                                                     Timestamp.)}
                                   ["id = ?" map-id])]
            (if (= 1 updated)
              (resp/ok (result->response (internal-fetch map-id)))
              (resp/bad-request {:message "document did not save"})))
          (resp/bad-request {:message "invalid map document"}))))))

(defn delete
  [owner-id id]
  {:pre [(integer? owner-id)
         (pos? owner-id)]}
  (prn 'map/delete {:owner-id owner-id, :map-id id})
  (let [map-id (try
                 (Integer/parseInt id)
                 (catch NumberFormatException e nil))]
    (if (or (nil? map-id)
            (not (pos? map-id)))
      (resp/bad-request {:message (str "invalid map ID: " (pr-str id))})
      (if (not= owner-id (-> map-id internal-fetch :owner))
        (resp/forbidden {:message "map not owned by authenticated user"})
        (let [[deleted] (delete! (:db system)
                                 "ssm.maps"
                                 ["id = ?" map-id])]
          (case deleted
            1 (resp/ok {:message "map deleted"})
            0 (resp/bad-request {:message "map not deleted; reason unknown"})
              (resp/bad-request
                {:message
                  (format "Houston, apparently %d maps were deleted!"
                          deleted)})))))))
