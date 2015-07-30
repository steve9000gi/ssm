My high-level plan is to let the view be rendered from the app-state, and then
have the various controls affect the app-state, which re-renders a new view.

App state should include:
- vector of nodes
  - each node:
    - shape
    - color
    - text
    - size (may or may not be derived from text)
    - position
    - hovered
    - url
    - note
  - selected node
- vector of links
  - each link:
    - source node
    - destination node
    - edge style
    - line thickness
    - color
    - hovered
  - selected link
- toolbox:
  - selected edge style
  - selected shape
  - selected color
  - options
    - show system support rings?
    - show circles of care
    - text line length
    - line thickness
    - grid enabled
  - show help text?
- contextual menu text items

Plan of attack:
x do basic frame, including logo, copyright, and system support rings
x do basic, immutable toolbox, without working options/help/buttons
x reflect toolbox selection state in view
  x edge style
  x node style
  x color
x add ability to add a node, with selected shape and color
o move node
o add ability to add a link, with selected style, color, and thickness

