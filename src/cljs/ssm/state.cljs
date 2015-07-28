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
    }))

