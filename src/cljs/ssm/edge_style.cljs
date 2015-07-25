(ns ssm.edge-style
  "Components controlling the edge style selection in the toolbox (i.e. whether
  to use solid lines or dashed lines for links between nodes).
  
  Only the last of these components is public. The other three are private to
  this namespace, signifying that they are implementation details.
  
  This component expects to be given a cursor with an `:edge-style` key whose
  value is a vector containing the style as a keyword. So far, the only
  supported styles are `:solid` and `:dashed`.
  
  The component draws the arrows, which, when clicked, change the cursor to the
  corresponding style.
  
  One shortcoming of React had to be smoothed over: it doesn't support some of
  the more exotic elements and attributes, especially for SVG. These attributes
  must be manually set after the component has been rendered to the DOM. This
  is accomplished by the `.setAttribute` calls below."

  (:require
    [om.core :as om :include-macros true]
    [sablono.core :as html :refer-macros [html]]
    ))

(defn- set-style [cursor style]
  (fn [e]
    (om/update! cursor [0] style)))

(defn- edge-style-rect
  [style-cursor owner {:keys [y-loc style] :as opts}]
  (reify
    om/IRender
    (render [_]
      (html
        [:rect#solidEdgeRect.edgeStyleRect
         {:x 0, :y y-loc
          :width "103px" :height "15px"
          :onClick (set-style style-cursor style)
          :style {:opacity "0.2"}}]))))

(defn- marker
  [style-cursor owner {:keys [id color] :as opts}]
  (reify
    om/IRender
    (render [_]
      (html
        [:marker {:id id
                  :viewBox "0 -5 10 10"
                  :fill color
                  :stroke color}
         [:path {:d "M0,-5L10,0L0,5"
                 :style {:stroke-linejoin "miter"}}]]))

    om/IDidMount
    (did-mount [this]
      (let [node (om/get-node owner)]
        (.setAttribute node "orient" "auto")
        (.setAttribute node "markerWidth" "3.75")
        (.setAttribute node "markerHeight" "3.75")))))

(defn- line [style-cursor owner {:keys [y-loc id style] :as opts}]
  (reify
    om/IRender
    (render [_]
      (html
        [:line.styleSelectionLine
         {:id id
          :x1 "0.6", :y1 y-loc, :x2 "82.4", :y2 y-loc
          :opacity "1"
          :stroke (if (= (get style-cursor 0) style) "#000000" "#666666")
          :class  (if (= (get style-cursor 0) style) "sel" "unsel")
          :onClick (set-style style-cursor style)
          :style {:marker-end (if (= (get style-cursor [0]) style)
                                "url(#selectedEdgeArrowHead)"
                                "url(#unselectedEdgeArrowHead)")
                  :stroke-width "3px"
                  :stroke (if (= (get style-cursor [0]) style)
                            "rgb(0,0,0)"
                            "rgb(102,102,102)")
                  :stroke-dasharray (if (= style :solid)
                                      "none"
                                      "10px,2px")}}]))))

(defn edge-style-selector [data owner]
  (reify
    om/IRender
    (render [_]
      (let [style-cursor (:edge-style data)]
        (html
          [:svg#edgeStyleSelectionSvg {:width "93px"
                                       :height "30px"
                                       :version "1.1"}
           (om/build edge-style-rect style-cursor
                     {:opts {:y-loc  0, :style  :solid}})
           (om/build edge-style-rect style-cursor
                     {:opts {:y-loc 15, :style :dashed}})
           (om/build marker style-cursor
                     {:opts {:id   "selectedEdgeArrowHead", :color "#000000"}})
           (om/build marker style-cursor
                     {:opts {:id "unselectedEdgeArrowHead", :color "#666666"}})
           (om/build line style-cursor
                     {:opts {:y-loc  "7.5", :id  "solidEdgeSelection",
                             :style :solid}})
           (om/build line style-cursor
                     {:opts {:y-loc "23.5", :id "dashedEdgeSelection",
                             :style :dashed}})])))

    om/IDidMount
    (did-mount [this]
      (let [node (om/get-node owner)]
        (.setAttribute node "xmlns" "http://www.w3.org/2000/svg")
        (.setAttribute node "xmlns:link" "http://www.w3.org/1999/xlink")))))

