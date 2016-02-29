var modDrag = require('./drag.js'),
    modEdgeStyle = require('./edge-style.js'),
    modEdgeThickness = require('./edge-thickness.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelectedShape = require('./selected-shape.js'),
    modSelection = require('./selection.js'),
    modSvg = require('./svg.js'),
    modText = require('./text.js'),
    modUpdate = require('./update.js'),
    modZoom = require('./zoom.js');

exports.connectClass = 'connect-node';
exports.lastKeyDown = -1;
exports.mouseDownNode = null;
exports.mouseDownLink = null;
exports.shapeId = 0;
exports.rightMouseBtn = 3;

var BACKSPACE_KEY = 8,
    DELETE_KEY = 46,
    graphMouseDown = false,
    defaultShapeText = {"circle":    "Identity",
                        "rectangle": "Responsibility",
                        "diamond":   "Need",
                        "ellipse":   "Resource",
                        "star":      "Wish",
                        "noBorder":  "text"},
    // shapeNum values are 1-based because they're used in front-facing text:
    shapeNum = {"circle": 1,
                "rectangle": 1,
                "diamond": 1,
                "ellipse": 1,
                "star": 1,
                "noBorder": 1};

var currentEdgeStyle = function(source, target) {
  return {
    source: source,
    target: target,
    style: modEdgeStyle.style,
    color: modSelectedColor.clr,
    thickness: modEdgeThickness.thickness,
    name: ""
  };
};

// Remove links associated with a node
var spliceLinksForNode = function(node) {
  var toSplice = modSvg.links.filter(function(l) {
        return (l.source === node || l.target === node);
      });
  toSplice.map(function(l) {
    modSvg.links.splice(modSvg.links.indexOf(l), 1);
  });
};

// Keydown on main svg
var svgKeyDown = function(d3) {
  // Make sure repeated key presses don't register for each keydown
  if (exports.lastKeyDown !== -1) { return; }

  exports.lastKeyDown = d3.event.keyCode;
  var selectedNode = modSelection.selectedNode,
      selectedEdge = modSelection.selectedEdge;

  switch (d3.event.keyCode) {
  case BACKSPACE_KEY:
  case DELETE_KEY:
    d3.event.preventDefault();
    if (selectedNode) {
      modSvg.nodes.splice(modSvg.nodes.indexOf(selectedNode), 1);
      spliceLinksForNode(selectedNode);
      modSelection.selectedNode = null;
      modUpdate.updateGraph(d3);
    } else if (selectedEdge) {
      modSvg.links.splice(modSvg.links.indexOf(selectedEdge), 1);
      modSelection.selectedEdge = null;
      modUpdate.updateGraph(d3);
    }
    break;
  }
};

var svgKeyUp = function() {
  exports.lastKeyDown = -1;
};

// Mousedown on main svg
var svgMouseDown = function() {
  graphMouseDown = true;
};

// Mouseup on main svg
var svgMouseUp = function(d3) {
  // Make sure options menu is closed:
  d3.select("#optionsMenuDiv") .classed("menu", false).classed("menuHidden", true);

  if (modZoom.justScaleTransGraph) { // Dragged not clicked
    modZoom.justScaleTransGraph = false;
  } else if (graphMouseDown && d3.event.shiftKey) { // Clicked not dragged from svg
    var xycoords = d3.mouse(modSvg.svgG.node()),
        text = defaultShapeText[modSelectedShape.shape] + " " +
               shapeNum[modSelectedShape.shape]++,
        d = exports.addNode(d3, xycoords[0], xycoords[1], text),
        d3element = modSvg.shapeGroups.filter(function(dval) {
          return dval.id === d.id;
        });

    // Make text immediately editable
    var d3txt = modText.changeElementText(d3, d3element, d),
        txtNode = d3txt.node();
    modText.selectText(txtNode);
    txtNode.focus();
  } else if (modDrag.shiftNodeDrag) { // Dragged from node
    modDrag.shiftNodeDrag = false;
    modDrag.dragLine.classed("hidden", true).style("stroke-width", 0);
  } else if (graphMouseDown) { // Left-click on background deselects currently selected
    if (modSelection.selectedNode) {
      modSelection.removeSelectFromNode();
    } else if (modSelection.selectedEdge) {
      modSelection.removeSelectFromEdge();
    }
  }
  graphMouseDown = false;
};

// FIXME: this function and the next one should really live elsewhere, modSvg
// probably.

exports.addNode = function(d3, x, y, text) {
  var d = {id: exports.shapeId,
           name: text,
           x: x,
           y: y,
           color: modSelectedColor.clr,
           shape: modSelectedShape.shape};
  modSvg.nodes.push(d);
  exports.shapeId++;
  modUpdate.updateGraph(d3);
  return d;
};

exports.addEdge = function(d3, newEdge) {
  var filtRes = modSvg.edgeGroups.filter(function(d) {
    if (d.source === newEdge.target && d.target === newEdge.source) {
      modSvg.links.splice(modSvg.links.indexOf(d), 1);
    }
    return d.source === newEdge.source && d.target === newEdge.target;
  });
  if (!filtRes[0].length) {
    modSvg.links.push(newEdge);
    modUpdate.updateGraph(d3);
    // Todo: finish adapting the following code block for edges for immediate text edit on create.
    /*
     var d3txt = modText.changeElementText(d3, modSvg.links.filter(function(dval) {
     return dval.name === newEdge.name;
     }), newEdge);
     var txtNode = d3txt.node();
     modText.selectText(txtNode);
     txtNode.focus();
     */
  }
};

exports.setupEventListeners = function(d3) {
  var svg = modSvg.svg;
  d3.select(window).on("keydown", function() {
    svgKeyDown(d3);
  })
    .on("keyup", function() {
      svgKeyUp();
    });
  svg.on("mousedown", function() {
    svgMouseDown();
  });
  svg.on("mouseup", function(){
    svgMouseUp(d3);
  });
  window.onresize = function() {modUpdate.updateWindow(d3);};
};

// Mousedown on node
exports.shapeMouseDown = function(d3, d) {
  d3.event.stopPropagation();
  exports.mouseDownNode = d;
  if (d3.event.shiftKey && !d.manualResize) { // No edges from manually resized rectangles
    modDrag.shiftNodeDrag = d3.event.shiftKey;
    modDrag.dragLine.classed("hidden", false) // Reposition dragged directed edge
      .style("stroke-width", modEdgeThickness.thickness)
      .attr("d", "M" + d.x + "," + d.y + "L" + d.x + "," + d.y);
  }
};

// Mouseup on nodes
exports.shapeMouseUp = function(d3, d3node, d) {
  // Reset the states
  modDrag.shiftNodeDrag = false;
  modDrag.justDragged = false;
  d3node.classed(exports.connectClass, false);

  var mouseDownNode = exports.mouseDownNode;

  if (!mouseDownNode) { return; }

  modDrag.dragLine.classed("hidden", true).style("stroke-width", 0);

  if (!mouseDownNode.manualResize // We didn't start on a manually resized rectangle...
    && mouseDownNode !== d) { // ...& we're in a different node: create new edge and add to graph
    exports.addEdge(d3, currentEdgeStyle(exports.mouseDownNode, d));
  } else { // We're in the same node or the dragged edge started on a manually resized rectangle
    if (modDrag.justDragged) { // Dragged, not clicked
      modDrag.justDragged = false;
    } else { // Clicked, not dragged
      if (d3.event.shiftKey // Shift-clicked node: edit text content...
          && !d.manualResize) { // ...that is, if not manually resizing rect
        var d3txt = modText.changeElementText(d3, d3node, d);
        var txtNode = d3txt.node();
        modText.selectText(txtNode);
        txtNode.focus();
      } else if (d3.event.which !== exports.rightMouseBtn) { // left- or mid-clicked
        modSelection.selectNode(d3node, d);
      }
    }
  }
  exports.mouseDownNode = null;
};

exports.pathMouseDown = function(d3, d3path, d) {
  d3.event.stopPropagation();
  exports.mouseDownLink = d;

  if (modSelection.selectedNode) {
    modSelection.removeSelectFromNode();
  }

  var prevEdge = modSelection.selectedEdge;
  if (!prevEdge || prevEdge !== d) {
    modSelection.replaceSelectEdge(d3, d3path, d);
  } else if (d3.event.which !== exports.rightMouseBtn) {
    modSelection.removeSelectFromEdge();
  }
};
