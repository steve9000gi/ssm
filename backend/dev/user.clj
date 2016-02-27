(ns user
  (:require
    [reloaded.repl :refer [system init start stop go reset]]
    [backend.system :refer [new-system]]))

(reloaded.repl/set-init! new-system)
