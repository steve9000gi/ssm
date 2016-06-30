var modSelectedColor = require('./selected-color.js'),
    modSelection = require('./selection.js'),
    modSvg = require('./svg.js');

exports.selectedEdge = null;
exports.selectedNode = null;
exports.selectedClass = 'selected';

var replaceSelectNode = function(d3Node, nodeData) {
  d3Node.classed(exports.selectedClass, true);
  if (exports.selectedNode) {
    exports.removeSelectFromNode();
  }
  nodeData.domId = d3Node.attr("id");
  exports.selectedNode = nodeData;
};

exports.selectNode = function(d3node, d) {
  if (exports.selectedEdge) {
    exports.removeSelectFromEdge();
  }
  var prevNode = exports.selectedNode;
  if (!prevNode || prevNode.id !== d.id) {
    replaceSelectNode(d3node, d);
  } else {
    exports.removeSelectFromNode();
  }
};

exports.removeSelectFromNode = function() {
  if (!exports.selectedNode) return;
  modSvg.shapeGroups.filter(function(cd) {
    return cd.id === exports.selectedNode.id;
  }).classed(exports.selectedClass, false);
  exports.selectedNode = null;
};

// Includes setting edge color back to its unselected value.
exports.removeSelectFromEdge = function() {
  var deselectedEdgeGroup = modSvg.edgeGroups.filter(function(cd) {
    return cd === exports.selectedEdge;
  }).classed(exports.selectedClass, false);

  deselectedEdgeGroup.select("path")
    .style("stroke", exports.selectedEdge.color)
    .style("marker-end", function(d) {
      var clr = d.color ? d.color.substr(1) : d.target.color.substr(1);
      return "url(#end-arrow" + clr + ")";
    });

  deselectedEdgeGroup.select(".foregroundText")
    .style("fill", exports.selectedEdge.color);
  exports.selectedEdge = null;
};

// Includes setting selected edge to selected edge color.
exports.replaceSelectEdge = function(d3, d3Path, edgeData) {
  if (d3.event.shiftKey) { return; }
  d3Path.classed(exports.selectedClass, true);
  d3Path.select("path")
    .style("stroke", modSelectedColor.color)
    .style("marker-end", "url(#selected-end-arrow)");
  d3Path.select(".foregroundText")
    .style("fill", modSelectedColor.color);
  if (modSelection.selectedEdge) {
    exports.removeSelectFromEdge();
  }
  modSelection.selectedEdge = edgeData;
};
