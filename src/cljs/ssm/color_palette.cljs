(ns ssm.color-palette
  "Components controlling the color palette in the toolbox (i.e.  whether to
  use red, blue, etc. when creating new nodes and links).
  
  This component expects to be given a cursor with a `:color` key whose value
  is a vector containing the color as a keyword. See the `ssm.state` namespace
  for more details.
  
  The component draws the colors, which, when clicked, change the state to the
  corresponding color."

  (:require
    [om.core :as om :include-macros true]
    [sablono.core :as html :refer-macros [html]]
    ))

(defn- set-color
  [cursor color]
  (fn [e]
    (om/update! cursor [0] color)))

(defn- sel-border-color
  [cursor style]
  (if (= (get cursor 0) style)
    "#fff"
    "#000"))

(defn- color-stripe
  [data owner {:keys [color] :as opts}]
  (reify
    om/IRender
    (render [_]
      (html
        [:div.colorBar {:id (str "clr" color)
                        :style {:background-color (str "#" color)
                                :border-color (sel-border-color data color)}
                        :onClick (set-color data color)}]))))

(defn color-palette [data owner]
  (reify
    om/IRender
    (render [_]
      (let [color-cursor (:color data)]
        (html
          [:div
           (for [color ["ff0000" "ff8800" "999900" "00bd00"
                        "00bdbd" "0000ff" "8800ff" "000000"]]
             (om/build color-stripe color-cursor {:opts {:color color}}))])))))

