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

(defn- no-move?
  [state x y]
  (let [{first-x :x, first-y :y} (:mouse-down-position state)]
    (and first-x
         first-y
         (= first-x x)
         (= first-y y))))

(defn- select-node
  [state index]
  (assoc state :selected-node index))

(defn- deselect-node
  [state]
  (assoc state :selected-node nil))

(defn- maybe-do
  "Return either the given state transformer `f` if `guard` is true or the
  identity function otherwise."
  [guard f]
  (if guard f identity))

(defmethod control-event :default
  [event-name args state]
  (println "Unknown event occurred:" event-name)
  (prn 'args args)
  state)

(defmethod control-event :node-mouse-down
  [_ {:keys [x y shift index]} state]
  (-> state
      (assoc :mouse-down-position {:x x, :y y})
      (assoc :moving-node index)))

(defmethod control-event :node-mouse-up
  [_ {:keys [shift x y index]} state]
  (let [maybe-select-node (maybe-do (no-move? state x y)
                                    #(select-node % index))]
    (-> state
        (assoc :moving-node nil)
        (assoc :mouse-down-position nil)
        maybe-select-node)))

(defmethod control-event :canvas-mouse-down
  [_ {:keys [x y shift]} state]
  (assoc state :mouse-down-position {:x x, :y y}))

(defmethod control-event :canvas-mouse-move
  [_ position state]
  (if-let [index (:moving-node state)]
    (assoc-in state [:nodes index :position] position)
    state))

(defn- add-node
  [state x y]
  (let [num-nodes (count (:nodes state))
        new-node {:index num-nodes
                  :shape (get-in state [:shape-style 0])
                  :color (get-in state [:color 0])
                  :text "default text"
                  :position {:x x, :y y}
                  :hovered false
                  :url nil
                  :note nil}]
    (update-in state [:nodes] conj new-node)))

(defmethod control-event :canvas-mouse-up
  [_ {:keys [shift x y] :as args} state]
  (let [no-move? (no-move? state x y)
        maybe-add-node (maybe-do (and shift no-move?)
                                 #(add-node % x y))
        maybe-deselect-node (maybe-do no-move? deselect-node)]
    (-> state
        (assoc :moving-node nil)
        (assoc :mouse-down-position nil)
        maybe-add-node
        maybe-deselect-node)))

