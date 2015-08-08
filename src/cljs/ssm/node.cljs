(ns ssm.node
  "Components controlling the nodes in the System Support Map. Nodes can be
  circles, rectangles, ellipses, etc., and are labelled with a text label.
  
  This component expects to be given a cursor with a `:nodes` key whose value
  is a vector containing the nodes to render. See the `ssm.state` namespace
  for more details."

  (:require-macros [cljs.core.async.macros :refer [go-loop]])
  (:require
    [om.core :as om :include-macros true]
    [cljs.core.async :refer [chan sliding-buffer put! <!]]
    [sablono.core :as html :refer-macros [html]]
    [goog.events :as events]
    [ssm.controls :refer [raise!]]
    [ssm.util :refer [raise-mouse-event!]]
    ))

;; TODO:
;; - get selected node working
;; - node deletion
;; - do url and note need to be rendered somewhere?

(defmulti inner-shape-tree
  (fn [shape color] shape))

(defmethod inner-shape-tree :circle
  [shape color]
  [:circle.shape.circle {:r "32.4"
                         :style {:stroke-width "2px"
                                 :stroke (str "#" color)}}])

(defmethod inner-shape-tree :rect
  [shape color]
  [:rect.shape.rectangle {:width "90.1"
                          :height "39.4"
                          :x "-45.0"
                          :y "-18.7"
                          :style {:stroke (str "#" color)
                                  :stroke-width "2px"}}]
  ;; there was also this circle hanging around...
  #_[:circle {:r "10"
            :cx "0"
            :cy "0"
            :transform "translate(45.0,19.7)"
            :style {:opacity "0"
                    :stroke "#ff5555"
                    :fill "#5555ff"}}])

(defmethod inner-shape-tree :diamond
  [shape color]
  [:path.shape.diamond {:d (str "M 30.975 0 "
                                "L 61.95 30.975 "
                                "L 30.975 61.95 "
                                "L 0 30.975 Z")
                        :transform "translate(-30.975,-30.975)"
                        :style {:stroke (str "#" color)
                                :stroke-width "2px"}}])

(defmethod inner-shape-tree :ellipse
  [shape color]
  [:ellipse.shape.ellipse {:rx "50.7" :ry "24"
                           :style {:stroke (str "#" color)
                                   :stroke-width "2px"}}])

(defmethod inner-shape-tree :star
  [shape color]
  [:polygon {:class "shape star"
             :points (str "25.88,35.62, 0.0,22.01, -25.88,35.62, "
                          "-20.94,6.80, -41.87,-13.60, -12.94,-17.81, "
                          "0.0,-44.03, 12.94,-17.81, 41.87,-13.60, "
                          "20.94,6.80")
             :style {:stroke (str "#" color)
                     :stroke-width "2px"}}])

(defmethod inner-shape-tree :none
  [shape color]
  [:text.foregroundText {:text-anchor "left"
                         :alignment-baseline "middle"
                         :text-decoration "none"
                         :dy "6"
                         :style {:fill (str "#" color)}}])

(defn node-component
  [data owner {:keys [index] :as opts}]
  (reify

    om/IDidMount
    (did-mount [_]
      (let [node (om/get-node owner)
            raise-fn (fn [evt-type]
                       #(raise-mouse-event! owner evt-type % {:index index}))]
        (events/listen node "mousedown" (raise-fn :node-mouse-down))
        (events/listen node "mouseup"   (raise-fn :node-mouse-up))))

    om/IRender
    (render [_]
      (let [{:keys [shape color text position hovered url note]}
              (get-in data [:nodes index])
            {:keys [x y]} position
            selected-node (:selected-node data)]
        (html
          [:g.shapeG {:class (when (= selected-node index) "selected")
                      :transform (str "translate(" x "," y ")")}
           (inner-shape-tree shape color)
           [:text.foregroundText {:text-anchor "left"
                                  :alignment-baseline "middle"
                                  :text-decoration "none"
                                  :dy "6"
                                  :style {:fill (str "#" color)}}
            [:tspan {:text-anchor "middle"
                     :x 0}
             text]]])))))

(defn nodes
  [data owner]
  (reify
    om/IRender
    (render [_]
      (html
        [:g#shapeGG
         (for [index (-> data :nodes count range)]
           (om/build node-component data
                     {:opts {:index index}}))]))))

