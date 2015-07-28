(ns ssm.shape-style
  "Components controlling the shape style selection in the toolbox (i.e.
  whether to use circles, stars, etc. when creating new nodes).
  
  This component expects to be given a cursor with a `:shape-style` key whose
  value is a vector containing the style as a keyword. See the `ssm.state`
  namespace for more details.
  
  The component draws the shapes, which, when clicked, change the state to the
  corresponding style."

  (:require
    [om.core :as om :include-macros true]
    [sablono.core :as html :refer-macros [html]]
    ))

(defn- sel-class
  [cursor style]
  (if (= (get cursor 0) style)
    "sel"
    "unsel"))

(defn- sel-stroke
  [cursor style]
  (if (= (get cursor 0) style)
    "rgb(0, 0, 0)"
    "rgb(102, 102, 102)"))

(defn- set-style
  [cursor style]
  (fn [e]
    (om/update! cursor [0] style)))

(defn shape-style-selector [data owner]
  (reify
    om/IRender
    (render [_]
      (let [style-cursor (:shape-style data)]
        (html
          [:svg#shapeSelectionSvg {:width "103px"
                                   :height "260px"
                                   :version "1.1"}

           [:circle#circleSelection.shapeSelection
            {:class (sel-class style-cursor :circle)
             :r 20
             :cx 51.5
             :cy 24
             :onClick (set-style style-cursor :circle)
             :style {:stroke (sel-stroke style-cursor :circle)
                     :stroke-width "2px"}}]

           [:rect#rectangleSelection.shapeSelection
            {:class (sel-class style-cursor :rect)
             :width "35.5"
             :height "30.5"
             :x "33.1"
             :y "49"
             :onClick (set-style style-cursor :rect)
             :style {:stroke (sel-stroke style-cursor :rect)
                     :stroke-width "2px"}}]

           [:rect#diamondSelection.shapeSelection
            {:class (sel-class style-cursor :diamond)
             :width "35.5"
             :height "35.5"
             :x "104.5", :y 78
             :transform "rotate(45, 70.9, 16)"
             :onClick (set-style style-cursor :diamond)
             :style {:stroke (sel-stroke style-cursor :diamond)
                     :stroke-width "2px"}}]

           [:ellipse#ellipseSelection.shapeSelection
            {:class (sel-class style-cursor :ellipse)
             :cx "51.5", :cy 154
             :rx 25, :ry 17
             :onClick (set-style style-cursor :ellipse)
             :style {:stroke (sel-stroke style-cursor :ellipse)
                     :stroke-width "2px"}}]

           [:polygon#starSelection.shapeSelection
            {:class (sel-class style-cursor :star)
             :x 50, :y "205.8"
             :onClick (set-style style-cursor :star)
             :style {:stroke (sel-stroke style-cursor :star)
                     :stroke-width "2px"}
             :points
             (str "67.63, 230.08, 50, 220.81, "
                  "32.37, 230.08, 35.73, 210.45, "
                  "21.47, 196.54, 41.18, 193.68, "
                  "50, 175.81, 58.82, 193.68, "
                  "78.53, 196.54, 64.27, 210.45")}]

           [:text#noBorderSelection.shapeSelection
            {:class (sel-class style-cursor :none)
             :x 50, :y "245.8"
             :text-anchor "middle"
             :onClick (set-style style-cursor :none)
             :style {:stroke (sel-stroke style-cursor :none)
                     :stroke-width "2px"}}
            "no border"]])))

    om/IDidMount
    (did-mount [this]
      (let [node (om/get-node owner)]
        (.setAttribute node "xmlns" "http://www.w3.org/2000/svg")
        (.setAttribute node "xmlns:link" "http://www.w3.org/1999/xlink")))))

