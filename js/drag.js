var modGrid = require('./grid.js'),
    modSvg = require('./svg.js'),
    modUpdate = require('./update.js');

exports.justDragged = false;
exports.shiftNodeDrag = false;
exports.clickDragHandle = false;
exports.dragLine = null;
exports.drag = null;
exports.dragHandle = null;

var dragmove = function(d3, d) {
  if (exports.shiftNodeDrag) { // Creating a new edge
    exports.dragLine.attr("d", "M" + d.x + "," + d.y + "L" + d3.mouse(modSvg.svgG.node())[0]
                       + "," + d3.mouse(modSvg.svgG.node())[1]);
  } else { // Translating a shape
    exports.dragLine.style("stroke-width", 0);
    d.x += d3.event.dx;
    d.y +=  d3.event.dy;
    modGrid.snap(d);
    modUpdate.updateGraph(d3);
  }
};

exports.setupDrag = function(d3) {
  exports.dragLine = modSvg.svgG.append("svg:path") // Displayed when dragging between nodes
    .attr("class", "link dragline hidden")
    .attr("d", function() { return "M0,0L0,0"; })
    .style("marker-end", "url(#mark-end-arrow)");

  exports.drag = d3.behavior.drag()
    .origin(function(d) {
      return {x: d.x, y: d.y};
    })
    .on("drag", function(args) {
      exports.justDragged = true;
      dragmove(d3, args);
    })
    .on("dragend", function(args) {
      modGrid.snap(args);
      // Todo check if edge-mode is selected
    });
};

// Handle goes in the lower right-hand corner of a rectangle: shift-drag to
// resize rectangle.
exports.setupDragHandle = function(d3) {
  exports.dragHandle = d3.behavior.drag()
    .on("dragstart", function(d) {
      if (!d3.event.sourceEvent.shiftKey) { return; }
      d.manualResize = true;
      d.name = "";
      d3.select(this).style("opacity", 1);
      if (!d.xOffset) {
        d.xOffset = d.width / 2;
        d.yOffset = d.height / 2;
      }
      d3.event.sourceEvent.stopPropagation();
    })
    .on("drag", function(d) {
      var x = d3.event.x;
      var y = d3.event.y;
      d3.select(this)
        .attr("transform", function() {
        return "translate(" + x + "," + y + ")";
      });
      d3.select("#shape" + d.id)
        .attr("width", Math.abs(x + d.xOffset))
        .attr("height", Math.abs(y + d.yOffset));
    })
    .on("dragend", function(d) {
      var rectangle = d3.select("#shape" + d.id);
      d.width = parseFloat(rectangle.attr("width"));
      d.height = parseFloat(rectangle.attr("height"));
      d3.select(this).style("opacity", 0);
      var currG = d3.select("#shapeG" + d.id);
      currG.select("text").text("");

      // Move the resized rect group to higher in the DOM so edges and other shapes are on top:
      var remove = currG.remove();
      d3.select("#manResizeGG").append(function() {
        return remove.node();
      });
    });
};
