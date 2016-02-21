(ns backend.migrate
  (:gen-class)
  (:require
    [ragtime.jdbc :as rag-jdbc]
    [ragtime.repl :as rag-repl]
    [backend.postgres :refer [db-spec]]
    ))

(defn- load-config []
  (let [{:keys [classname subprotocol host port dbname] :as db-spec} (db-spec)
        db-spec2 (assoc db-spec :subname (str "//" host ":" port "/" dbname))]
    {:datastore  (rag-jdbc/sql-database db-spec2)
     :migrations (rag-jdbc/load-resources "migrations")}))

(defn- print-usage []
  (println "Specify `migrate` or `rollback` as the only argument."))

(defn migrate []
  (rag-repl/migrate (load-config)))

(defn rollback []
  (rag-repl/rollback (load-config)))

(defn -main [& args]
  (cond
    (not= 1 (count args))
    (print-usage)

    (= "migrate" (first args))
    (do
      (println "Migrating database schema...")
      (migrate))

    (= "rollback" (first args))
    (do
      (println "Rolling back database schema...")
      (rollback))

    :else
    (print-usage)))
