(ns backend.handler
  (:require
    [com.stuartsierra.component :as component]
    [org.httpkit.server :refer [run-server]]
    [compojure.core :refer [defroutes GET POST]]
    ; [backend.user :as user]
    ; [backend.session :as session]
    ))

(defrecord HTTPServer [port ring-handler-fn]
  component/Lifecycle
  (start [this]
    (println ";; Starting HTTPServer component")
    (assoc this :server (run-server ring-handler-fn {:port port})))

  (stop [this]
    (println ";; Stopping HTTPServer component")
    (when-let [server (:server this)]
      ;; The constructor above returns a function that, when called, will stop
      ;; the server. So just call the value that we saved above.
      (server))
    (dissoc this :server)))

(defroutes app
  (GET "/ping" [] "pong")  ;; health check
  ;; TODO: access post params
  ; (POST "/register" [_] (user/create _))
  ; (POST "/login" [_] (session/create _))
  ; (GET "/logout" [_] (session/destroy _))
  )

;; TODO: look into "API" and other middleware, esp. cookies
;; TODO: this component properly depends on the DB, and needs to be able to
;; pass it places.

(defn new-http-server
  ([] (new-http-server nil nil))
  ([handler] (new-http-server nil handler))
  ([port handler]
   (->HTTPServer (or port 8080) (or handler app))))

