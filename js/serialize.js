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
exports.timestamp = null; // timestamp of originating tool (ssm or wizard)
var timestamp = "2018/04/16 13:42"; //timestamp for this tool

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
  // Begin demographic items for ssm-wizard-d (/?module=CaregiversOfCYSHCN):
  if (exports.age) {
    jsonOut.age = exports.age;
  }
  if (exports.county) {
    jsonOut.county = exports.county;
  }
  if (exports.healthConditions) {
    jsonOut.healthConditions = exports.healthConditions;
  }
  if (exports.hispanic) {
    jsonOut.hispanic = exports.hispanic;
  }
  if (exports.insurance) {
    jsonOut.insurance = exports.insurance;
  }
  if (exports.language) {
    jsonOut.language = exports.language;
  }
  if (exports.race) {
    jsonOut.race = exports.race;
  }
  if (exports.state) {
    jsonOut.state = exports.state;
  }
  // End demographic items for ssm-wizard-d (/?module=CaregiversOfCYSHCN)
  // Begin demographic items for ssm-wizard-TitleX:
  if (exports.affiliation) {
    jsonOut.affiliation = exports.affiliation;
  }
  if (exports.city) {
    jsonOut.city = exports.city;
  }
/* Covered above
  if (exports.county) {
    jsonOut.county = exports.county;
  }
*/
  if (exports.firstName) {
    jsonOut.firstName = exports.firstName;
  }
  if (exports.lastName) {
    jsonOut.lastName = exports.lastName;
  }
  if (exports.reason) {
    jsonOut.reason = exports.reason;
  }
  if (exports.roleType) {
    jsonOut.roleType = exports.roleType;
  }
/* Covered above
  if (exports.state) {
    jsonOut.state = exports.state;
  }
*/
  if (exports.workplaceSetting) {
    jsonOut.workplaceSetting = exports.workplaceSetting;
  }
  if (exports.zipcode) {
    jsonOut.zipcode = exports.zipcode;
  }
  // End demographic items for ssm-wizard-TitleX

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
    // Begin demographic items for ssm-wizard-d (/?module=CaregiversOfCYSHCN):
    if (jsonObj.age) {
      exports.age = jsonObj.age;
    }
    if (jsonObj.county) {
      exports.county = jsonObj.county;
    }
    if (jsonObj.healthConditions) {
      exports.healthConditions = jsonObj.healthConditions;
    }
    if (jsonObj.hispanic) {
      exports.hispanic = jsonObj.hispanic;
    }
    if (jsonObj.insurance) {
      exports.insurance = jsonObj.insurance;
    }
    if (jsonObj.language) {
      exports.language = jsonObj.language;
    }
    if (jsonObj.race) {
      exports.race = jsonObj.race;
    }
    if (jsonObj.state) {
      exports.state = jsonObj.state;
    }
    // End demographic items for ssm-wizard-d (/?module=CaregiversOfCYSHCN)
    // Begin demographic items for ssm-wizard-TitleX:
    if (jsonObj.affiliation) {
      exports.affiliation = jsonObj.affiliation;
    }
    if (jsonObj.city) {
      exports.city = jsonObj.city;
    }
  /* Covered above
    if (jsonObj.county) {
      exports.county = jsonObj.county;
    }
  */
    if (jsonObj.firstName) {
      exports.firstName = jsonObj.firstName;
    }
    if (jsonObj.lastName) {
      exports.lastName = jsonObj.lastName;
    }
    if (jsonObj.reason) {
      exports.reason = jsonObj.reason;
    }
    if (jsonObj.roleType) {
      exports.roleType = jsonObj.roleType;
    }
  /* Covered above
    if (jsonObj.state) {
      exports.state = jsonObj.state;
    }
  */
    if (jsonObj.workplaceSetting) {
      exports.workplaceSetting = jsonObj.workplaceSetting;
    }
    if (jsonObj.zipcode) {
      exports.zipcode = jsonObj.zipcode;
    }
    // End demographic items for ssm-wizard-TitleX


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
