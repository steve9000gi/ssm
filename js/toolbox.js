var modRingsize = require('./ringsize.js'),
    modCirclesOfCare = require('./circles-of-care.js'),
    modEdgeStyle = require('./edge-style.js'),
    modHelp = require('./help.js'),
    modOptionsMenu = require('./options-menu.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelectedShape = require('./selected-shape.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modUpdate = require('./update.js');

// Edge, shape, and color selection, plus "?" help and Options buttons, load,
// save, and delete.
exports.prepareToolbox = function(d3) {
  modCirclesOfCare.center = null;
  modSystemSupportMap.center = null; 

  // Handle delete graph
  d3.select("#delete-graph").on("click", function() { modUpdate.deleteGraph(d3, false); });

  modHelp(d3);
  modOptionsMenu.createOptionsMenu(d3);
  modOptionsMenu.createOptionsButton(d3);
  modSelectedColor.createColorPalette(d3);
  modSelectedShape.addShapeSelection(d3);
  modEdgeStyle.addControls(d3);
};
