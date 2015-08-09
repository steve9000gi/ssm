(ns backend.postgres
  (:require [com.stuartsierra.component :as component])
  (:import com.jolbox.bonecp.BoneCPDataSource))

(defn pooled-datasource
  [{:keys [classname subprotocol user password init-part-size max-part-size
           idle-time host port dbname partitions] :as db-spec}]
  (doto (BoneCPDataSource.)
    (.setDriverClass classname)
    (.setJdbcUrl (str "jdbc:" subprotocol "://" host ":" port "/" dbname))
    (.setUsername user)
    (.setPassword password)
    (.setMinConnectionsPerPartition init-part-size)
    (.setMaxConnectionsPerPartition max-part-size)
    (.setPartitionCount partitions)
    (.setStatisticsEnabled true)
    (.setIdleMaxAgeInMinutes (or idle-time 60))))

(defn get-config
  [key]
  (or (System/getenv key)
      (System/getProperty key)))

(defrecord PostgresDB []
  component/Lifecycle
  (start [this]
    (println ";; Starting PostgresDB component")
    (assoc this
           :datasource
           (pooled-datasource
             {:subprotocol "postgresql"
              :host     (get-config "DB_HOST")
              :port     (get-config "DB_PORT")
              :dbname   (get-config "DB_NAME")
              :user     (get-config "DB_USER")
              :password (get-config "DB_PASSWORD")
              :classname "org.postgresql.Driver"
              :init-part-size 1
              :max-part-size 4
              :partitions 2})))

  (stop [this]
    (println ";; Stopping PostgresDB component")
    (when-let [ds (:datasource this)]
      (.close ds))
    (dissoc this :datasource)))

