var modRingsize = require('./ringsize.js'),
    modContextMenu = require('./context-menu.js'),
    modDatabase = require('./database.js'),
    modDrag = require('./drag.js'),
    modEvents = require('./events.js'),
    modFile = require('./file.js'),
    modFrontMatter = require('./front-matter.js'),
    modOptionsMenu = require('./options-menu.js'),
    modSelectedColor = require('./selected-color.js'),
    modSvg = require('./svg.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modToolbox = require('./toolbox.js'),
    modTooltips = require('./tooltips.js'),
    modZoom = require('./zoom.js');

var defineArrowMarkers = function(d3) {
  // Arrow markers for graph links (i.e., edges that persist after mouse up)
  var defs = d3.select("#mainSVG").append("svg:defs");
  defs.selectAll("marker")
  .data(modSelectedColor.colorChoices)
  .enter().append("marker")
    .attr("id", function(d) { return "end-arrow" + d; })
    .attr("viewBox", "0 -5 10 10")
    .attr("markerWidth", 3.5)
    .attr("markerHeight", 3.5)
    .attr("orient", "auto")
    .attr("fill", function(d) { return "#" + d; })
    .attr("stroke", "none")
  .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  // Special-purpose markers for leading arrow (just while dragging), for selected, and for hover:
  var markerData = [
    {"id": "mark-end-arrow", "fill": "#000000"},
    {"id": "selected-end-arrow", "fill": modSelectedColor.color},
    {"id": "hover-end-arrow", "fill": modSelectedColor.hoverColor}];
  defs.selectAll(".specialMarker")
  .data(markerData)
  .enter().append("marker")
    .classed("specialMarker", true)
    .attr("id", function(d) { return d.id; })
    .attr("viewBox", "0 -5 10 10")
    .attr("markerWidth", 3.5)
    .attr("markerHeight", 3.5)
    .attr("orient", "auto")
  .append("svg:path")
    .attr("fill", function(d, i) { return markerData[i].fill; })
    .attr("stroke", "none")
    .attr("d", "M0,-5L10,0L0,5");
};

// Manually Resized Rectangles (MMRs) are moved to manResizeGroups so that other
// shapes and edges appear on top of them because manResizeGroups is earlier in
// the DOM.
var setupMMRGroup = function() {
  modSvg.svgG.append("g").attr("id", "manResizeGG").selectAll("g");
};

// Define graphcreator object
exports.create = function(d3) {
  modToolbox.prepareToolbox(d3);
  modFrontMatter.addLogos(d3);
  modFrontMatter.addCopyright(d3);
  modFrontMatter.addCredits(d3);
  modTooltips.setupNotes(d3);
  defineArrowMarkers(d3);
  modSystemSupportMap.create(d3);
  setupMMRGroup();
  modDrag.setupDrag(d3);
  modDrag.setupDragHandle(d3);
  modZoom.setup(d3, modSvg.svg);
  modSvg.edgeGroups = modSvg.svgG.append("g").attr("id", "pathGG").selectAll("g");
  modSvg.shapeGroups = modSvg.svgG.append("g").attr("id", "shapeGG").selectAll("g");
  modEvents.setupEventListeners(d3);
  modSystemSupportMap.show(d3);
  modFile.setupDownload(d3, window.saveAs, window.Blob);
  modFile.setupUpload(d3);
  modDatabase.setupReadMapFromDatabase(d3);
  modDatabase.setupWriteMapToDatabase(d3);
  modContextMenu.setup(d3);
};
