(ns ssm.core
  "This is the main namespace. It's responsible for setting up some
  environmental things and starting Om."
  (:require
    [om.core :as om :include-macros true]
    [ssm.svg :as svg]
    [ssm.toolbox :as toolbox]
    [ssm.state :refer [app-state]]))

(enable-console-print!)

(defn on-js-reload
  "Hook for after figwheel reloads the page"
  [])

(om/root toolbox/toolbox
         app-state
         {:target (.getElementById js/document "toolbox")})

(om/root svg/svg-component
         app-state
         {:target (.getElementById js/document "mainSVGDiv")})

