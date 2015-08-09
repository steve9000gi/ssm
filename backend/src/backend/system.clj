(ns backend.system
  (:gen-class)
  (:require
    [com.stuartsierra.component :as component]
    (backend
      [postgres :refer [->PostgresDB]]
      [handler :refer [new-http-server]])
    ))

(defn new-system []
  (component/system-map
    :db (->PostgresDB)
    :httpd (new-http-server)))

