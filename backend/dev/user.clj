(ns user
  (:require
    [ragtime.jdbc :as rag-jdbc]
    [ragtime.repl :as rag-repl]
    [reloaded.repl :refer [system init start stop go reset]]
    [backend.postgres :refer [db-spec]]
    [backend.system :refer [new-system]]))

(defn load-config []
  (let [{:keys [classname subprotocol host port dbname] :as db-spec} (db-spec)
        db-spec2 (assoc db-spec :subname (str "//" host ":" port "/" dbname))]
    {:datastore  (rag-jdbc/sql-database db-spec2)
     :migrations (rag-jdbc/load-resources "migrations")}))

(defn migrate []
  (rag-repl/migrate (load-config)))

(defn rollback []
  (rag-repl/rollback (load-config)))

(reloaded.repl/set-init! new-system)
