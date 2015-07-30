(ns ssm.core
  "This is the main namespace. It's responsible for setting up some
  environmental things and starting Om."
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
    [cljs.core.async :refer [chan <!]]
    [om.core :as om :include-macros true]
    [ssm.controls :refer [control-event]]
    [ssm.svg :as svg]
    [ssm.toolbox :as toolbox]
    [ssm.state :refer [app-state]]))

(enable-console-print!)

(defn ^:export log-app-state
  "For debugging during development, type '(log-app-state)' into the Figwheel
  console, then check the browser's console to see the app state."
  []
  (.log js/console (clj->js @app-state)))

(defn install-om
  "Install the Om root(s) into the page."
  [control-chan]
  (om/root toolbox/toolbox
           app-state
           {:target (.getElementById js/document "toolbox")
            :shared {:control-chan control-chan}})
  (om/root svg/svg-component
           app-state
           {:target (.getElementById js/document "mainSVGDiv")
            :shared {:control-chan control-chan}}))

(defn init
  "Initialize the Om app. When Figwheel is active, this is called after every
  code hot-reload."
  []
  (let [control-chan (chan)]
    (install-om control-chan)
    (go (while true
          (let [[event-name args] (<! control-chan)]
            (swap! app-state
                   (fn [state]
                     (control-event event-name args state))))))))

(init)

