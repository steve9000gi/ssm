var modDatabase = require('./database.js'),
    modEvents = require('./events.js'),
    modSelection = require('./selection.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modSvg = require('./svg.js'),
    modText = require('./text.js'),
    modUpdate = require('./update.js');

exports.wizardActive = undefined;

var nodesByType = {
      'role': null,
      'responsibility': [],
      'need': [],
      'resource': []
    },
    step = 1,
    curResponsibility,
    curNeed,
    forceLayout,
    drawForceLayoutTransition = true;

var addRoleThenNext = function(d3) {
  var text = d3.select('input[name=role]').node().value,
      center = modSystemSupportMap.center,
      node = modEvents.addNode(d3, center.x, center.y, text);
  node.type = 'role';
  node.__children = [];
  nodesByType.role = node;
  d3.select('#wizard_role_text').text(text);
  modDatabase.writeMapToDatabase(d3, true);
  exports.nextStep(d3);
};

var targetRadius = function(nodeType) {
  var ringNum = {
    'responsibility': 1,
    'need': 2,
    'resource': 3
  }[nodeType];
  var ringRadii = modSystemSupportMap.ringRadii,
      innerRingRadius = ringRadii[ringNum - 1],
      outerRingRadius = ringRadii[ringNum];
  return (innerRingRadius + outerRingRadius) / 2;
};

var addNode = function(d3, type, parent, text) {
  var newNode,
      numSiblings = nodesByType[type].length,
      center = modSystemSupportMap.center,
      cx = center.x,
      cy = center.y,
      cr = targetRadius(type), // a.k.a. distance from center point
      dx, dy, x, y;

  if (numSiblings === 0) {
    newNode = modEvents.addNode(d3, cx + cr, cy, text);
  } else if (numSiblings === 1) {
    newNode = modEvents.addNode(d3, cx - cr, cy, text);
  } else {
    numSiblings++;
    for (var i=1; i < numSiblings; i++) {
      var theta = -i * 2 * Math.PI / numSiblings;
      dx = cr * Math.cos(theta);
      dy = cr * Math.sin(theta);
      x = cx + dx;
      y = cy - dy; // remember that y is inverted in SVG
      if (i == numSiblings - 1) {
        newNode = modEvents.addNode(d3, x, y, text);
      } else {
        var node = nodesByType[type][i];
        node.x = x;
        node.y = y;
      }
    }
  }

  var edge = {
    source: parent,
    target: newNode,
    style: 'solid',
    color: '#000000',
    thickness: 3,
    name: ''
  };
  modEvents.addEdge(d3, edge);
  newNode.type = type;
  newNode.__parent = parent;
  newNode.__parent.__children.push(newNode);
  newNode.__children = [];
  nodesByType[type].push(newNode);
  return newNode;
};

var addResponsibility = function(d3) {
  var inputEl = d3.select('input[name=responsibility]').node();
  addNode(d3, 'responsibility', nodesByType.role, inputEl.value);
  inputEl.value = '';
  modDatabase.writeMapToDatabase(d3, true);
};

var addNeed = function(d3) {
  var inputEl = d3.select('input[name=need]').node(),
      parent = nodesByType.responsibility[curResponsibility];
  addNode(d3, 'need', parent, inputEl.value);
  inputEl.value = '';
  modDatabase.writeMapToDatabase(d3, true);
};

var addResource = function(d3) {
  var inputEl = d3.select('input[name=resource]').node(),
      helpfulness = d3.select('input[name=helpfulness]:checked').node().value,
      parent = nodesByType.need[curNeed],
      newNode = addNode(d3, 'resource', parent, inputEl.value);
  inputEl.value = '';
  d3.selectAll('input[name=helpfulness]').property('checked', false);
  newNode.helpfulness = helpfulness;
  modDatabase.writeMapToDatabase(d3, true);
};

var highlightResponsibility = function(d3, responsibilityNumber) {
  if (responsibilityNumber === null) {
    modSelection.removeSelectFromNode();
    return;
  }
  if (responsibilityNumber >= nodesByType.responsibility.length) {
    return;
  }
  var node = nodesByType.responsibility[responsibilityNumber],
      d3node = d3.select('#shapeG' + node.id);
  d3.select('#wizard_responsibility_count')
    .text(nodesByType.responsibility.length);
  d3.select('#wizard_current_responsibility_number')
    .text(responsibilityNumber + 1);
  d3.select('#wizard_current_responsibility_text')
    .text(node.name);
  modSelection.selectNode(d3node, node);
};

var highlightNeed = function(d3, needNumber) {
  if (needNumber === null) {
    modSelection.removeSelectFromNode();
    return;
  }
  if (needNumber >= nodesByType.need.length) {
    return;
  }
  var node = nodesByType.need[needNumber],
      d3node = d3.select('#shapeG' + node.id);
  d3.select('#wizard_need_count')
    .text(nodesByType.need.length);
  d3.select('#wizard_current_need_number')
    .text(needNumber + 1);
  d3.select('#wizard_current_need_text')
    .text(node.name);
  modSelection.selectNode(d3node, node);
};

var attachButtonHandlers = function(d3) {
  d3.selectAll('#wizard button.next')
    .on('click', function(){ exports.nextStep(d3); });
  d3.selectAll('#wizard button.back')
    .on('click', function(){ exports.prevStep(d3); });
  d3.selectAll('#wizard button.finish')
    .on('click', function(){ exports.hideWizard(d3); });
  d3.selectAll('#wizard button.add-role-next')
    .on('click', function(){ addRoleThenNext(d3); });
  d3.selectAll('#wizard button.add-responsibility')
    .on('click', function(){ addResponsibility(d3); });
  d3.selectAll('#wizard button.add-need')
    .on('click', function(){ addNeed(d3); });
  d3.selectAll('#wizard button.add-resource')
    .on('click', function(){ addResource(d3); });
};

exports.showWizard = function(d3) {
  document.getElementById('wizard').className = 'open';
  document.getElementById('toolbox').style.visibility = 'hidden';
  exports.wizardActive = true;
  exports.showStep(d3);
  modUpdate.updateWindow(d3);
};

exports.hideWizard = function(d3) {
  document.getElementById('wizard').className = 'closed';
  document.getElementById('toolbox').style.visibility = 'visible';
  exports.wizardActive = false;
  modDatabase.writeMapToDatabase(d3);
  modUpdate.updateWindow(d3);
};

exports.showStep = function(d3) {
  var i, id, el;
  for (i=1; i <= 8; i++) {
    id = 'wizard-step' + i;
    if (i === step) {
      if ((el = document.getElementById(id))) {
        el.style.display = 'block';
      }
    } else {
      if ((el = document.getElementById(id))) {
        el.style.display = 'none';
      }
    }
  }
  attachButtonHandlers(d3);
};

var steps = {
  // Note: uninteresting steps are omitted here.
  6: {
    enter: function(d3, direction) {
      curResponsibility =
        (direction === 1 ? 0 : nodesByType.responsibility.length - 1);
      highlightResponsibility(d3, curResponsibility);
    },
    exit: function(d3) {
      highlightResponsibility(d3, null);
    },
    subStepAdvance: function(d3) {
      if (++curResponsibility !== nodesByType.responsibility.length) {
        highlightResponsibility(d3, curResponsibility);
        return true;
      }
      return false;
    },
    subStepRetreat: function(d3) {
      if (--curResponsibility >= 0) {
        highlightResponsibility(d3, curResponsibility);
        return true;
      }
      return false;
    }
  },

  7: {
    enter: function(d3, direction) {
      curNeed = (direction === 1 ? 0 : nodesByType.need.length - 1);
      highlightNeed(d3, curNeed);
    },
    exit: function(d3) {
      highlightNeed(d3, null);
    },
    subStepAdvance: function(d3) {
      if (++curNeed !== nodesByType.need.length) {
        highlightNeed(d3, curNeed);
        return true;
      }
      return false;
    },
    subStepRetreat: function(d3) {
      if (--curNeed >= 0) {
        highlightNeed(d3, curNeed);
        return true;
      }
      return false;
    }
  }
};

exports.nextStep = function(d3) {
  var stepObj = steps[step] || {};
  // TODO: persist map state
  if (stepObj.subStepAdvance && stepObj.subStepAdvance(d3)) {
    // The current step isn't ready to move on to the next step.
    return;
  }
  stepObj.exit && stepObj.exit(d3);
  step++;
  stepObj = steps[step] || {};
  stepObj.enter && stepObj.enter(d3, 1);
  exports.showStep(d3);
};

exports.prevStep = function(d3) {
  var stepObj = steps[step] || {};
  if (stepObj.subStepRetreat && stepObj.subStepRetreat(d3)) {
    // The current step isn't ready to move on to the previous step.
    return;
  }
  stepObj.exit && stepObj.exit(d3);
  step--;
  stepObj = steps[step] || {};
  stepObj.enter && stepObj.enter(d3, -1);
  exports.showStep(d3);
};
