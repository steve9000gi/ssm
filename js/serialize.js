var modCirclesOfCare = require('./circles-of-care.js'),
    modEvents = require('./events.js'),
    modSvg = require('./svg.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modUpdate = require('./update.js'),
    modWizard = require('./wizard.js'),
    modZoom = require('./zoom.js');

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

var getEdges = function() {
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
  return saveEdges;
};

var getNodes = function() {
  // This, except we need to filter out "private" properties that begin with '__':
  var rawNodes = modSvg.nodes;
  var i, prop;
  var ret = [];
  for (i=0; i<rawNodes.length; i++) {
    ret[i] = {};
    for (prop in rawNodes[i]) {
      if (rawNodes[i].hasOwnProperty(prop)) {
        if (!prop.startsWith('__')) {
          ret[i][prop] = rawNodes[i][prop];
        }
      }
    }
  }
  return ret;
};

// Return the current map as an JS object.
exports.getMapObject = function(d3) {
  var ret = {
    "nodes": getNodes(),
    "links": getEdges(),
    "graphGTransform": d3.select("#graphG").attr("transform"),
    "systemSupportMapCenter": modSystemSupportMap.center,
    "circlesOfCareCenter": modCirclesOfCare.center,
    "wizardActive": modWizard.wizardActive,
    "focusDescription": modWizard.focusDescription,
    "focusContext": modWizard.focusContext,
    "firstName": modWizard.firstName,
    "lastName": modWizard.lastName,
    "title": modWizard.title,
    "agencyName": modWizard.agencyName,
    "agencyType": modWizard.agencyType,
    "city": modWizard.city,
    "reason": modWizard.reason,
    "version": "SSM Wizard Title V 2017/07/27"
  };
  if (modWizard.wizardActive) {
    ret.wizardCurrentStep = modWizard.currentStep;
    ret.wizardCurrentResponsibility = modWizard.currentResponsibility;
    ret.wizardCurrentNeed = modWizard.currentNeed;
    ret.wizardSubStepState = modWizard.getCurrentSubStepState(d3);
  }
  return ret;
};

// Import a JSON document into the editing area
exports.importMap = function(d3, jsonObj, id) {
  // TODO better error handling
  try {
    modUpdate.deleteGraph(d3, true);
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
    modCirclesOfCare.hide(d3);
    modCirclesOfCare.center = jsonObj.circlesOfCareCenter;
    if (modCirclesOfCare.center) {
      modCirclesOfCare.show(d3);
    }
    modUpdate.updateGraph(d3);
    if (typeof id === 'number') {
      window.location.hash = '/map/' + id;
    }

    modWizard.focusDescription = jsonObj.focusDescription;
    modWizard.focusContext = jsonObj.focusContext;

    if (jsonObj.wizardActive) {
      modWizard.currentStep = jsonObj.wizardCurrentStep;
      modWizard.currentResponsibility = jsonObj.wizardCurrentResponsibility;
      modWizard.currentNeed = jsonObj.wizardCurrentNeed;
      modWizard.inferParentChildRelationships(d3);
      modWizard.showWizard(d3, jsonObj.wizardSubStepState);
    }
  } catch(err) {
    window.alert("Error parsing uploaded file\nerror message: " + err.message);
    return;
  }
};
