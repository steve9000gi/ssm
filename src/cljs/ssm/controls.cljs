(ns ssm.controls
  (:require
    [cljs.core.async :refer [put!]]
    [om.core :as om :include-macros true]
    [ssm.state :refer [app-state]]))

(defmulti control-event
  "Given an event, arguments to the event, and the current state of the app,
  return a new state.
  
  When our app emits an event, it will (through `controls-handler` below) get
  routed through this multi-method, which will dispatch based on the event
  name. For each event-name, there should be a corresponding method."
  (fn [event-name args state] event-name))

(defn raise!
  "Raise an app-level event. Enqueues the event (including associated
  arguments) to the control channel, an async channel stored in the global
  app-state. The `go` loop in the `core` namespace is responsible for dequeuing
  it and handling it."
  [owner val]
  (put! (om/get-shared owner :control-chan) val)
  true)

(defmethod control-event :default
  [event-name args state]
  (println "Unknown event occurred:" event-name)
  (prn 'args args)
  state)

(defmethod control-event :canvas-click
  [_ {:keys [shift x y]} state]
  (if shift
    (let [new-node {:shape (get-in state [:shape-style 0])
                    :color (get-in state [:color 0])
                    :text "default text"
                    :position {:x x, :y y}
                    :hovered false
                    :url nil
                    :note nil}]
      (update-in state [:nodes] conj new-node))
    state))

(defmethod control-event :drag-node-start
  [_ args state])

(defmethod control-event :drag-node-move
  [_ args state])

(defmethod control-event :drag-node-end
  [_ args state])

