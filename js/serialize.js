var modRingsize = require('./ringsize.js'),
    modCirclesOfCare = require('./circles-of-care.js'),
    modEvents = require('./events.js'),
    modGridZoom = require('./grid-zoom.js'),
    modSvg = require('./svg.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modUpdate = require('./update.js'),
    modZoom = require('./zoom.js');

exports.focusContext = null;
exports.focusDescription = null;
exports.version = null; // version of originating web tool (ssm or wizard)
var version = "ssm"; // version of this tool
exports.timestamp = null; // timestamnp of originating tool (ssm or wizard)
var timestamp = "2017/08/15 09:43"; //timestamp for this tool

var getBiggestShapeId = function() {
  var currMax = 0;
  var i;
  for (i = 0; i < modSvg.nodes.length; i++) {
    if (modSvg.nodes[i].id > currMax) {
      currMax = modSvg.nodes[i].id;
    }
  }
  return currMax;
};

// Return the current map as a JS object.
exports.getMapObject = function(d3) {
  var saveEdges = [];
  modSvg.links.forEach(function(val) {
    saveEdges.push({source: val.source.id,
                    target: val.target.id,
                    style: val.style,
                    color: val.color,
                    thickness: val.thickness,
                    maxCharsPerLine: val.maxCharsPerLine,
                    note: val.note,
                    name: val.name,
                    manualResize: val.manualResize || false
                   });
  });
  var jsonOut = {
    "nodes": modSvg.nodes,
    "links": saveEdges,
    "graphGTransform": d3.select("#graphG").attr("transform"),
    "systemSupportMapCenter": modSystemSupportMap.center,
    "circlesOfCareCenter": modCirclesOfCare.center,
    "ringsize": modRingsize.ringsize
  };
  if (exports.focusContext) {
    jsonOut.focusContext = exports.focusContext;
  }
  if (exports.focusDescription) {
    jsonOut.focusDescription = exports.focusDescription;
  }
  jsonOut.version = exports.version ? exports.version : version;
  jsonOut.timestamp = exports.timestamp  ? exports.timestamp : timestamp;
  return jsonOut;
};

// Import a JSON document into the editing area
exports.importMap = function(d3, jsonObj, id) {
  // TODO better error handling
  try {
    modUpdate.deleteGraph(d3, true);
    if (jsonObj.focusContext) {
      exports.focusContext = jsonObj.focusContext;
    }
    if (jsonObj.focusDescription) {
      exports.focusDescription = jsonObj.focusDescription;
    }
    if (jsonObj.version) {
      exports.version = jsonObj.version;
    }
    if (jsonObj.timestamp) {
      exports.timestamp = jsonObj.timestamp;
    }
    modSvg.nodes = jsonObj.nodes;
    modEvents.shapeId = getBiggestShapeId() + 1;
    var newEdges = jsonObj.links;
    newEdges.forEach(function(e, i) {
      newEdges[i] = {source: modSvg.nodes.filter(function(n) {
                      return n.id === e.source; })[0],
                     target: modSvg.nodes.filter(function(n) {
                      return n.id === e.target; })[0],
                     style: (e.style === "dashed" ? "dashed" : "solid"),
                     color: e.color,
                     thickness: e.thickness,
                     maxCharsPerLine: (e.maxCharsPerLine || 20),
                     note: e.note,
                     name: e.name,
                     manualResize: e.manualResize};
    });
    modSvg.links = newEdges;

    var graphGTransform = jsonObj.graphGTransform || "translate(0,0) scale(1)";
    // Inform zoomSvg that we're programmatically setting transform (so additional zoom and
    // translate work smoothly from that transform instead of jumping back to default):
    d3.select("#graphG").attr("transform", graphGTransform);
    var xform = d3.transform(d3.select("#graphG").attr("transform"));
    var tx = xform.translate[0], ty = xform.translate[1], scale = xform.scale[0];
    modZoom.zoomSvg.translate([tx, ty]).scale(scale);
    modZoom.zoomSvg.event(modSvg.svg.transition().duration(500));

    modSystemSupportMap.center = jsonObj.systemSupportMapCenter;
    if (modSystemSupportMap.center) {
      modSystemSupportMap.show(d3);
    } else {
      modSystemSupportMap.hide(d3);
    }
    modRingsize.ringsize = jsonObj.ringsize;
    if (modRingsize.ringsize == "small") {
      modRingsize.showSmall(d3);
    } else {
      modRingsize.showLarge(d3);
    }
    modCirclesOfCare.hide(d3);
    modCirclesOfCare.center = jsonObj.circlesOfCareCenter;
    if (modCirclesOfCare.center) {
      modCirclesOfCare.show(d3);
    }
    modUpdate.updateGraph(d3);
    if (typeof id === 'number') {
      window.location.hash = '/map/' + id;
    }
  } catch(err) {
    window.alert("Error parsing uploaded file\nerror message: " + err.message);
    return;
  }
};
