(ns ssm.svg
  "This is the super component that renders the entire SVG space. Most of the
  actual work is done with sub-components, most of which are in separate
  namespaces."

  (:require
    [om.core :as om :include-macros true]
    [sablono.core :as html :refer-macros [html]]
    [ssm.color-palette :as color-palette]
    [ssm.edge-style :as edge-style]
    [ssm.node :as node]
    [ssm.shape-style :as shape-style]
    [ssm.controls :refer [raise!]]
    [ssm.util :refer [raise-mouse-event!]]
    ))

(defn- ssm-circle
  [radius color]
  [:circle.ssmCircle {:r radius
                      :cx "673.5" :cy "399"
                      :style {:stroke (str "#" color)
                              :fill "none"}}])

(defn- ssm-label
  [x y color text]
  [:text.ssmLabel {:x x, :y y
                   :style {:fill (str "#" color)
                           :font-size "12px"}}
   text])

(defn svg-component
  [data owner]
  (reify
    om/IRender
    (render [_]
      (html

        [:svg.mainSVG {:width "1347", :height "795"
                       :onMouseDown
                       #(raise-mouse-event! owner :canvas-mouse-down %)
                       :onMouseMove
                       #(raise-mouse-event! owner :canvas-mouse-move %)
                       :onMouseUp
                       #(raise-mouse-event! owner :canvas-mouse-up %)
                       :style {:font-family "arial"}}

         [:image#logos {:x "-52", :y "0"
                        :width "546", :height "60"}]
         [:g.graph#graphG nil
          [:g.ssmGroup.ssmVisible nil
           (ssm-circle 110 "8800ff")
           (ssm-circle 275 "0000ff")
           (ssm-circle 475 "00bdbd")
           (ssm-circle 675 "000000")
           (ssm-label "640.1" "309" "8800ff" "Role/Identity")
           (ssm-label "590.1" "152" "0000ff" "Most Important Responsibilities")
           (ssm-label "570.4" "-50" "00bdbd"
                      "General Needs for Each Responsibility")
           (ssm-label "618.8" "-258" "000000" "Available Resources")
           (ssm-label "649.2" "-287" "999900" "Wish List")]
          [:g#graphGG nil
           (om/build node/nodes data)]]]))

    om/IDidMount
    (did-mount [_]
      ;; FIXME: this gets the SVG node but needs to get the image node
      #_(let [node (om/get-node owner)]
        (.setAttribute node "xmlns:xlink" "http://www.w3.org/1999/xlink")
        (.setAttribute node "xlink:href" "img/mch-tracs.png")))))

