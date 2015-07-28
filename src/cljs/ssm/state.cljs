(ns ssm.state
  "The application state atom, including documentation.")

(defonce app-state
  (atom
    {
     ;; This is the edge style. Users can select solid (the default) or dashed
     ;; lines in the toolbox. Controlled by the `ssm.edge-style` namespace.
     ;; Remember that only maps and vectors can be cursors in Om, which is why
     ;; we wrap the actual value in a vector (so we can pass only the vector,
     ;; rather than the whole state, to `ssm.edge-style` components).
     ;; Valid values: `#{:solid :dashed}`
     :edge-style [:solid]

     ;; The shape style. Users can select various shapes in the toolbox, which
     ;; controls the shape of new nodes. Controlled by the `ssm.shape-style`
     ;; namespace.
     ;; Valid values: `#{:circle :rect :diamond :ellipse :square :none}`
     :shape-style [:circle]

     ;; The color for new nodes and links. Users can select various colors in
     ;; the toolbox. Controlled by the `ssm.color-palette` namespace.
     ;; Valid values: `#{"ff0000" "ff8800" "999900" "00bd00"
     ;;                  "00bdbd" "0000ff" "8800ff" "000000"}`
     :color ["000000"]
    }))

