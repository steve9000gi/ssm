(ns ssm.toolbox
  "This is the super component that renders the entire toolbox. Most of the
  actual work is done with sub-components, most of which are in separate
  namespaces."

  (:require
    [om.core :as om :include-macros true]
    [sablono.core :as html :refer-macros [html]]
    [ssm.color-palette :as color-palette]
    [ssm.edge-style :as edge-style]
    [ssm.shape-style :as shape-style]
    ))

(defn toolbox
  [data owner]
  (reify
    om/IRender
    (render [_]
      (html
        [:div
         ;; Note: missing a div#edgeStyleSelectionDiv container here, but
         ;; shouldn't matter.
         (om/build edge-style/edge-style-selector data)
         ;; Note: missing a div#shapeSelectionDiv container here, but shouldn't
         ;; matter.
         (om/build shape-style/shape-style-selector data)
         (om/build color-palette/color-palette data)
         [:div#btnDiv nil
          [:input#helpBtn {:type "button", :value "?"}]
          [:input#optionsBtn {:type "button", :value "Options"}]]
         [:input#hidden-file-upload {:type "file"}]
         [:input#hidden-textFile-upload {:type "file"}]
         [:input.iconInput#upload-input {:type "image"
                                         :title "open map"
                                         :alt "open map"
                                         :src "img/upload-icon.png"}]
         [:input.iconInput#download-input {:type "image"
                                           :title "save map"
                                           :alt "save map"
                                           :src "img/download-icon.png"}]
         [:input.iconInput#delete-graph {:type "image"
                                         :title "delete map"
                                         :alt "delete map"
                                         :src "img/trash-icon.png"}]]))))

