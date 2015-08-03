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
     ;; Valid values: `#{:circle :rect :diamond :ellipse :star :none}`
     :shape-style [:circle]

     ;; The color for new nodes and links. Users can select various colors in
     ;; the toolbox. Controlled by the `ssm.color-palette` namespace.
     ;; Valid values: `#{"ff0000" "ff8800" "999900" "00bd00"
     ;;                  "00bdbd" "0000ff" "8800ff" "000000"}`
     :color ["000000"]

     ;; This is a vector of the nodes in the System Support Map. Nodes show up
     ;; as circles, rectangles, diamonds, ellipses, stars, or even without a
     ;; border (as controlled by the `:shape-style` setting in the state).
     ;; Initially there are no nodes, but an example one, commented out, is
     ;; below for reference and documentation purposes.
     :nodes [
             #_{
                ;; The index within the `:nodes` array of this node.
                :index 0
                ;; The shape of this node. See `:shape-style` above.
                :shape :circle
                ;; The color. See `:color` above.
                :color "999900"
                ;; The text to display in the node.
                :text "some text"
                ;; The position, in pixels, counting up from the upper left.
                :position {:x 123, :y 456}
                ;; Eventually we will want size to be a separate property, not
                ;; strictly derived from the text, because we need to support
                ;; equalizing the sizes of all the shapes. But that's for
                ;; later. (TODO)
                ; :size
                ;; Is the cursor hovering over the node? Should be true/false.
                :hovered false
                ;; The URL associated with the node.
                :url nil
                ;; The note associated with the node.
                :note nil
                }
             ]

     ;; The user may select a node by clicking on it. The selected node is
     ;; highlighted a different color and can be deleted with a keystroke. The
     ;; setting here indicates the index (base 0) into the `:nodes` vector, and
     ;; should be `nil` if there are no nodes, or if none is selected.
     :selected-node nil

     ;; The user may drag a node to move it. Upon the mousedown event for the
     ;; node, the index of the node gets put here.  Then upon mouseup, this
     ;; gets set back to `nil`.
     :moving-node nil

     ;; The following enables us to discern between click events and drag
     ;; events on the canvas. When the mouse-down event occurs, we save the
     ;; position here as e.g. `{:x 123, :y 456}`. Then when the mouse-up event
     ;; occurs, we compare that event's position with the position stored here.
     ;; If they're the same, it was a click event, which may mean that we
     ;; create a new node. Otherwise, it was a drag event.
     :mouse-down-position nil
    }))

(comment
  ;; You can run CLJS code in your browser from the open Figwheel session in
  ;; your terminal. Just type some code into the Figwheel console, and when you
  ;; hit return it will compile the code and run it in the attached browser.

  ;; Below are some expressions that are useful for testing. We `assoc` things
  ;; directly into the state, and Om/React running in the browser will
  ;; (assuming our code is good) render it appropriately.

  ;; (Note: this is in a `comment` block for two reasons: (1) it's more
  ;; convenient when we have multiple lines and expressions than using either
  ;; `;` or `#_`, and (2) it's a convention in Clojure-land to have "tests" and
  ;; commonly used development expressions that don't belong in the main code
  ;; in a comment block. Also, with a sufficiently powerful text editor like
  ;; Vim (with vim-fireplace) or Emacs (with Cider), you can execute this code
  ;; directly without having to copy-and-paste into a different terminal
  ;; window.

  ;; Clear all nodes from the state.
  (swap! ssm.state/app-state assoc :nodes [])

  ;; Set a black circle as the only node in the state.
  (swap! ssm.state/app-state
         assoc :nodes
         [{:index 0
           :shape :circle
           :color "000000"
           :text "Identity 1"
           :position {:x 120, :y 120}
           :hovered false
           :url nil
           :note nil}])

  ;; Set the list of nodes to one of each shape, each with different colors.
  (swap! ssm.state/app-state
         assoc :nodes
         [{:index 0
           :shape :circle
           :color "000000"
           :text "Identity 1"
           :position {:x 120, :y 120}
           :hovered false
           :url nil
           :note nil}
          {:index 1
           :shape :rect
           :color "8800ff"
           :text "Responsibility 1"
           :position {:x 140, :y 140}
           :hovered false
           :url nil
           :note nil}
          {:index 2
           :shape :diamond
           :color "0000ff"
           :text "Need 1"
           :position {:x 160, :y 160}
           :hovered false
           :url nil
           :note nil}
          {:index 3
           :shape :ellipse
           :color "00bdbd"
           :text "Resource 1"
           :position {:x 180, :y 180}
           :hovered false
           :url nil
           :note nil}
          {:index 4
           :shape :star
           :color "00bd00"
           :text "Wish 1"
           :position {:x 200, :y 200}
           :hovered false
           :url nil
           :note nil}
          {:index 5
           :shape :none
           :color "999900"
           :text "Text 1"
           :position {:x 220, :y 220}
           :hovered false
           :url nil
           :note nil}])

  )

