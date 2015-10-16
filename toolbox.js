var modCirclesOfCare = require('./circles-of-care.js'),
    modEdgeStyle = require('./edge-style.js'),
    modHelp = require('./help.js'),
    modOptionsMenu = require('./options-menu.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelectedShape = require('./selected-shape.js'),
    modSystemSupportMap = require('./system-support-map.js');

// Edge, shape, and color selection, plus "?" help and Options buttons, load,
// save, and delete.
exports.prepareToolbox = function(d3) {
  var thisGraph = this;
  modCirclesOfCare.center = null; // CirclesOfCareCenter
  modSystemSupportMap.center = null; // System Support Map Center

  // Handle delete graph
  d3.select("#delete-graph").on("click", function() { thisGraph.deleteGraph(false); });

  modHelp(d3);
  modOptionsMenu.createOptionsMenu(d3);
  modOptionsMenu.createOptionsButton(d3);
  modSelectedColor.createColorPalette(d3);
  modSelectedShape.addShapeSelection(d3);
  modEdgeStyle.addControls(d3);
};
