var modCompletions = require('./completions.js'),
    modDatabase = require('./database.js'),
    modEntryList = require('./entry-list.js'),
    modEvents = require('./events.js'),
    modSelection = require('./selection.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modSvg = require('./svg.js'),
    modText = require('./text.js'),
    modUpdate = require('./update.js');

exports.wizardActive = undefined;
exports.currentStep = 1;
exports.currentResponsibility = undefined;
exports.currentNeed = undefined;

var numSteps = 9;
var nodesByType = {
      'role': null,
      'responsibility': [],
      'need': [],
      'resource': []
    };

var addRoleThenNext = function(d3) {
  var text = d3.select('input[name=role]').node().value,
      center = modSystemSupportMap.center,
      node = modEvents.addNode(d3, center.x, center.y, text);
  if (!text) {
    alert('You must enter a role before proceeding.');
    return false;
  }
  node.type = 'role';
  node.__children__ = [];
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

var setPosition = function(node, x, y) {
  node.x = x;
  node.y = y;
};

var rebalanceNodes = function(d3) {
  var center = modSystemSupportMap.center,
      cx = center.x,
      cy = center.y,
      nodeTypes = ['responsibility', 'need', 'resource'];
  setPosition(nodesByType.role, cx, cy);
  for (var typeNum = 0; typeNum < nodeTypes.length; typeNum++) {
    var type = nodeTypes[typeNum],
        nodes = nodesByType[type],
        radius = targetRadius(type),
        i, theta, x, y ;
    for (i=0; i < nodes.length; i++) {
      theta = -i * 2 * Math.PI / nodes.length;
      x = cx + radius * Math.cos(theta);
      y = cy - radius * Math.sin(theta); // remember that y is inverted in SVG
      setPosition(nodes[i], x, y);
    }
  }
  modUpdate.updateGraph(d3);
};

var addNode = function(d3, type, parent, text, edgeColor) {
  var newNode = modEvents.addNode(d3, 0, 0, text),
      edge = {
        source: parent,
        target: newNode,
        style: 'solid',
        color: edgeColor || 'black',
        thickness: 3,
        name: ''
      };
  modEvents.addEdge(d3, edge);
  newNode.type = type;
  newNode.__parent__ = parent;
  newNode.__parent__.__children__.push(newNode);
  newNode.__children__ = [];
  nodesByType[type].push(newNode);
  rebalanceNodes(d3);
  return newNode;
};

var addResource = function(d3) {
  var inputEl = d3.select('input[name=resource]').node(),
      // TODO: what if no helpfulness radio is checked?
      helpfulness = d3.select('input[name=helpfulness]:checked').node().value,
      parent = nodesByType.need[exports.currentNeed],
      edgeColor = helpfulness === 'helpful' ? 'green'
                : helpfulness === 'not-helpful' ? 'red'
                : 'black',
      newNode = addNode(d3, 'resource', parent, inputEl.value, edgeColor);
  inputEl.value = '';
  d3.selectAll('input[name=helpfulness]').property('checked', false);
  newNode.helpfulness = helpfulness;
  modDatabase.writeMapToDatabase(d3, true);
};

var removeNode = function(d3, type, indexAmongType, skipConfirm) {
  var node = nodesByType[type][indexAmongType];
  var confirmTxt = 'Are you sure you want to remove this ' + type + '?';
  if (type === 'responsibility') {
    confirmTxt += ' All connected needs and resources (if any) will be removed!';
  } else if (type === 'need') {
    confirmTxt += ' All connected resources (if any) will be removed too!';
  }
  var proceed = skipConfirm || window.confirm(confirmTxt);
  if (!proceed) return false;
  modSvg.nodes.splice(modSvg.nodes.indexOf(node), 1);
  modSvg.links.filter(function(l){
    return l.source === node || l.target === node;
  }).map(function(l){
    modSvg.links.splice(modSvg.links.indexOf(l), 1);
  });
  for (var i=0; i < node.__children__.length; i++) {
    var child = node.__children__[i];
    removeNode(d3, child.type, nodesByType[child.type].indexOf(child), true);
  }
  var arr = node.__parent__.__children__;
  arr.splice(arr.indexOf(node), 1);
  nodesByType[type].splice(indexAmongType, 1);
  if (!skipConfirm) rebalanceNodes(d3);
  return true;
};

var setupNeedEntryList = function(d3, responsibilityNumber) {
  var responsibility = nodesByType.responsibility[responsibilityNumber];
  var uponAdd = function(i, text) {
    addNode(d3, 'need', responsibility, text);
    modDatabase.writeMapToDatabase(d3, true);
  };

  var uponUpdate = function(i, text) {
    var node = responsibility.__children__[i],
        d3element = modSvg.shapeGroups.filter(function(dval) {
          return dval.id === node.id;
        });
    modText.changeElementTextImmediately(d3, d3element, node, text);
    modDatabase.writeMapToDatabase(d3, true);
    modUpdate.updateGraph(d3);
  };

  var uponRemove = function(i) {
    var node = responsibility.__children__[i],
        idx = nodesByType.need.indexOf(node);
    if (!removeNode(d3, 'need', idx)) return false;
    modDatabase.writeMapToDatabase(d3, true);
    modUpdate.updateGraph(d3);
    return true;
  };

  var selector = '#wizard-need-list';
  var existingTexts = responsibility.__children__.map(function(d) {
    return d.name;
  });
  modEntryList.teardown(d3, selector);
  modEntryList.setup(d3, selector, existingTexts,
                     modCompletions.completionsByType.need,
                     uponAdd, uponUpdate, uponRemove);
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
  // This probably doesn't really belong here, but it is a convenient place.
  if (responsibilityNumber !== null) {
    setupNeedEntryList(d3, responsibilityNumber);
  }
};

var setupResourceForm = function(d3) {
  var groups = d3
        .select('#wizard-resource-needs')
        .selectAll('div.wizard-need-group')
        .data(nodesByType.responsibility)
        .enter().append('div')
        .attr('class', 'wizard-need-group');
  groups.append('h5')
    .text(function(d){ return d.name; });
  // This is a `selectAll` on a `selectAll` selection, so this qualifies as a
  // nested d3 selection. See https://bost.ocks.org/mike/nest/ for info.
  var labels = groups
        .selectAll('label')
        .data(function(d){ return d.__children__; })
        .enter().append('label');
  labels.append('input')
    .attr('type', 'checkbox')
    .attr('name', function(d, indexInResp, indexOfResp){
      return 'a' + indexOfResp + '_' + indexInResp;
    });
  // Using d3's `.text` here will wipe out the checkboxes appended above.
  // See https://github.com/d3/d3/issues/94
  labels.each(function(d){
    this.appendChild(document.createTextNode(d.name));
  });
  d3.select('#resource-type-completions')
    .selectAll('option')
    .data(modCompletions.completionsByType.resource)
    .enter().append('option')
    .attr('value', String);
};

var guardedClose = function(d3) {
  var confirmText = 'Are you sure you want to close the wizard? ' +
        '(This action cannot be undone.)';
  if (window.confirm(confirmText)) {
    exports.hideWizard(d3);
  }
};

var attachButtonHandlers = function(d3) {
  d3.selectAll('#wizard div.close span')
    .on('click', function(){ guardedClose(d3); });
  d3.selectAll('#wizard button.next')
    .on('click', function(){ exports.nextStep(d3); });
  d3.selectAll('#wizard button.back')
    .on('click', function(){ exports.prevStep(d3); });
  d3.selectAll('#wizard button.finish')
    .on('click', function(){ exports.hideWizard(d3); });
  d3.selectAll('#wizard button.add-role-next')
    .on('click', function(){ addRoleThenNext(d3); });
  d3.selectAll('#wizard button.add-resource')
    .on('click', function(){ addResource(d3); });
  // Stop propagation of keydown events, so that the handlers elsewhere in this
  // code don't prevent default. I need to do this to allow users to hit
  // 'backspace' in these fields.
  d3.selectAll('#wizard input[type=text]')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });
  d3.selectAll('#wizard textarea')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });
};

exports.inferParentChildRelationships = function(d3) {
  var nodes = modSvg.nodes,
      edges = modSvg.links,
      i;
  for (i=0; i<nodes.length; i++) {
    var node = nodes[i],
        type = node.type;
    node.__children__ = [];
    if (type === 'role') {
      nodesByType[type] = node;
    } else {
      nodesByType[type].push(node);
    }
  }
  for (i=0; i<edges.length; i++) {
    var source = edges[i].source,
        target = edges[i].target;
    source.__children__.push(target);
    target.__parent__ = source;
  }
};

exports.showWizard = function(d3) {
  document.getElementById('wizard').className = 'open';
  document.getElementById('toolbox').style.visibility = 'hidden';
  exports.wizardActive = true;
  exports.initializeAtStep(d3);
  modUpdate.updateWindow(d3);
};

exports.hideWizard = function(d3) {
  document.getElementById('wizard').className = 'closed';
  document.getElementById('toolbox').style.visibility = 'visible';
  exports.wizardActive = false;
  modUpdate.updateWindow(d3);
};

exports.showStep = function(d3) {
  var i, id, el;
  for (i=1; i <= numSteps; i++) {
    id = 'wizard-step' + i;
    if (i === exports.currentStep) {
      if ((el = document.getElementById(id))) {
        el.style.display = 'block';
      }
    } else {
      if ((el = document.getElementById(id))) {
        el.style.display = 'none';
      }
    }
  }
  if (exports.currentStep && steps[exports.currentStep] &&
      steps[exports.currentStep].isMinimized) {
    document.getElementById('wizard').className = 'minimized';
  } else {
    document.getElementById('wizard').className = 'open';
  }
  attachButtonHandlers(d3);
};

var steps = {
  // Note: uninteresting steps are omitted here.
  5: {
    enter: function(d3) {
      var uponAdd = function(i, text) {
        addNode(d3, 'responsibility', nodesByType.role, text);
        modDatabase.writeMapToDatabase(d3, true);
      };

      var uponUpdate = function(i, text) {
        var node = nodesByType.responsibility[i],
            d3element = modSvg.shapeGroups.filter(function(dval) {
              return dval.id === node.id;
            });
        modText.changeElementTextImmediately(d3, d3element, node, text);
        modDatabase.writeMapToDatabase(d3, true);
        modUpdate.updateGraph(d3);
      };

      var uponRemove = function(i) {
        if (!removeNode(d3, 'responsibility', i)) return false;
        modDatabase.writeMapToDatabase(d3, true);
        modUpdate.updateGraph(d3);
        return true;
      };

      var selector = '#wizard-responsibility-list';
      var existingTexts = nodesByType.responsibility.map(function(d) {
        return d.name;
      });
      modEntryList.setup(d3, selector, existingTexts,
                         modCompletions.completionsByType.responsibility,
                         uponAdd, uponUpdate, uponRemove);
    },

    exit: function(d3) {
      if (nodesByType.responsibility.length === 0) {
        alert('You must enter some responsibilities before proceeding.');
        return false;
      }
      modEntryList.teardown(d3, '#wizard-responsibility-list');
      return true;
    }
  },

  6: {
    enter: function(d3, direction) {
      if (direction === 1) {
        exports.currentResponsibility = 0;
      } else if (direction === -1) {
        exports.currentResponsibility = nodesByType.responsibility.length - 1;
      }
      highlightResponsibility(d3, exports.currentResponsibility);
    },

    exit: function(d3) {
      highlightResponsibility(d3, null);
      return true;
    },

    subStepAdvance: function(d3) {
      // Require confirmation before advancing from an empty need list.
      var respNode = nodesByType.responsibility[exports.currentResponsibility];
      if (respNode.__children__.length === 0 && !respNode.noChildrenOK) {
        var confirmTxt = 'Are you sure you want to proceed without adding any' +
              ' needs for this responsibility?';
        if (!confirm(confirmTxt)) return true;
        respNode.noChildrenOK = true;
      }
      // Advance to the next responsibility, if possible; else to the next step.
      if (++exports.currentResponsibility !== nodesByType.responsibility.length){
        highlightResponsibility(d3, exports.currentResponsibility);
        return true;
      }
      return false;
    },

    subStepRetreat: function(d3) {
      if (--exports.currentResponsibility >= 0) {
        highlightResponsibility(d3, exports.currentResponsibility);
        return true;
      }
      return false;
    }
  },

  7: { isMinimized: true },

  8: {
    enter: function(d3, direction) {
      if (direction === 1) {
        exports.currentNeed = 0;
      } else if (direction === -1) {
        exports.currentNeed = nodesByType.need.length - 1;
      }
      setupResourceForm(d3);
    },

    exit: function(d3) {
      setupResourceForm(d3);
      return true;
    },

    subStepAdvance: function(d3) {
      if (++exports.currentNeed !== nodesByType.need.length) {
        setupResourceForm(d3);
        return true;
      }
      return false;
    },

    subStepRetreat: function(d3) {
      if (--exports.currentNeed >= 0) {
        setupResourceForm(d3);
        return true;
      }
      return false;
    }
  }
};

exports.initializeAtStep = function(d3) {
  var stepObj = steps[exports.currentStep] || {};
  if (stepObj.enter) stepObj.enter(d3, 0);
  exports.showStep(d3);
};

exports.nextStep = function(d3) {
  var stepObj = steps[exports.currentStep] || {};
  if (stepObj.subStepAdvance && stepObj.subStepAdvance(d3)) {
    // The current step isn't ready to move on to the next step.
    return;
  }
  // A step can prevent advancement by returning something falsy from `exit`.
  if (!stepObj.exit || stepObj.exit(d3)) {
    exports.currentStep++;
    stepObj = steps[exports.currentStep] || {};
    if (stepObj.enter) stepObj.enter(d3, 1);
    exports.showStep(d3);
  }
};

exports.prevStep = function(d3) {
  var stepObj = steps[exports.currentStep] || {};
  if (stepObj.subStepRetreat && stepObj.subStepRetreat(d3)) {
    // The current step isn't ready to move on to the previous step.
    return;
  }
  if (stepObj.exit) stepObj.exit(d3);
  exports.currentStep--;
  stepObj = steps[exports.currentStep] || {};
  if (stepObj.enter) stepObj.enter(d3, -1);
  exports.showStep(d3);
};
