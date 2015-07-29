(ns ssm.core
  "This is the main namespace. It's responsible for setting up some
  environmental things and starting Om."
  (:require
    [om.core :as om :include-macros true]
    [ssm.color-palette :as color-palette]
    [ssm.edge-style :as edge-style]
    [ssm.node :as node]
    [ssm.shape-style :as shape-style]
    [ssm.state :as state]))

(enable-console-print!)

(defn on-js-reload
  "Hook for after figwheel reloads the page"
  [])

(om/root edge-style/edge-style-selector
         state/app-state
         {:target (.getElementById js/document "edgeStyleSelectionDiv")})

(om/root shape-style/shape-style-selector
         state/app-state
         {:target (.getElementById js/document "shapeSelectionDiv")})

(om/root color-palette/color-palette
         state/app-state
         {:target (.getElementById js/document "colorPalette")})

(om/root node/nodes
         state/app-state
         {:target (.getElementById js/document "graphGG")})

