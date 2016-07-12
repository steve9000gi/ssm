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
    },
    // a flag to be set when user selects "continue" option from "add resources"
    // interstitial:
    doneWithResources;

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

var addNode = function(d3, type, parent_s, text, edgeColor) {
  // parent_s might be single parent or an array of many parents
  var newNode = modEvents.addNode(d3, 0, 0, text),
      parents = [].concat(parent_s),
      multiParent = parents.length > 1,
      newEdge = function(src) { return {
        source: src,
        target: newNode,
        style: 'solid',
        color: edgeColor || 'black',
        thickness: 3,
        name: ''
      }; };
  newNode.__parents__ = parents.slice(0);
  for (var i=0; i < parents.length; i++) {
    modEvents.addEdge(d3, newEdge(parents[i]));
    newNode.__parents__[i].__children__.push(newNode);
  }
  newNode.type = type;
  newNode.__children__ = [];
  nodesByType[type].push(newNode);
  rebalanceNodes(d3);
  return newNode;
};

// If a resource already exists with the given number, update it; otherwise, add
// one at that number in `nodesByType.resource`. Return true if successful, or
// false if insufficient data entered in form.
var upsertResource = function(d3, resourceNumber) {
  var type = d3.select('input[name=resource_type]'),
      name = d3.select('input[name=resource_name]'),
      checkedNeedsSel = '#wizard-resource-needs input[type=checkbox]:checked',
      checkedParentNeeds = d3.selectAll(checkedNeedsSel),
      checkedHelpfulness = d3.select('input[name=helpfulness]:checked').node(),
      helpDescrip = d3.select('textarea[name=resource_helpfulness_description'),
      noType = type.node().value === '',
      noNeeds = checkedParentNeeds.size() === 0,
      noHelpfulness = !checkedHelpfulness;

  if (noType) {
    type.transition(0.5)
      .style('border', '1px solid red')
      .style('background-color', '#ffa');
    d3.select('#wizard-resource-type-error')
      .text('Please enter a resource type.')
      .style('color', '#a00')
      .append('br');
  }

  if (noNeeds) {
    d3.select('#wizard-resource-needs')
      .transition(0.5)
      .style('border', '1px solid red');
    d3.select('#wizard-resource-needs-error')
      .text('Please select at least one related need.')
      .style('color', '#a00')
      .append('br');
  }

  if (noHelpfulness) {
    d3.select('#wizard-resource-helpfulness-radio-group')
      .transition(0.5)
      .style('border', '1px solid red');
    d3.select('#wizard-resource-helpfulness-error')
      .text('Please select one option below.')
      .style('color', '#a00')
      .append('br');
  }

  if (noType || noNeeds || noHelpfulness) return false;
  if (resourceNumber >= nodesByType.resource.length) {
    // insert
    var helpfulness = checkedHelpfulness.value,
        edgeColor = helpfulness === 'helpful' ? 'green'
                  : helpfulness === 'not-helpful' ? 'red'
                  : 'black',
        parents = [];

    checkedParentNeeds.each(function(){
      // A name might be `a2_3`, for example.
      var indexes = d3.select(this).attr('name').slice(1).split('_'),
          resp = nodesByType.responsibility[indexes[0]];
      parents.push(resp.__children__[indexes[1]]);
    });

    var newNode = addNode(d3, 'resource', parents, type.node().value, edgeColor),
        nameNode = name.node(),
        hdNode = helpDescrip.node();
    newNode.helpfulness = helpfulness;
    if (nameNode) newNode.specific_name = nameNode.value;
    if (hdNode) newNode.helpfulnessDescription = hdNode.value;
    modDatabase.writeMapToDatabase(d3, true);
    return true;

  } else {
    // TODO: update
  }
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
  for (i=0; i < node.__parents__.length; i++) {
    var arr = node.__parents__[i].__children__;
    arr.splice(arr.indexOf(node), 1);
  }
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
  if (responsibilityNumber >= nodesByType.responsibility.length) return;
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

var clearResourceForm = function(d3) {
  d3.select('#wizard-step8 input[name=resource_type]').property('value', '');
  d3.select('#wizard-step8 input[name=resource_name]').property('value', '');
  d3.select('#resource-type-completions').selectAll('option').remove();
  d3.select('#wizard-resource-needs').selectAll('div').remove();
  d3.select('#wizard-step8 input[name=helpfulness]:checked')
    .property('checked', false);
  d3.select('#wizard-step8 textarea').property('value', '');
};

var setupResourceForm = function(d3, resourceNum) {
  document.getElementById('wizard').className = 'open';
  d3.select('#wizard-step8 .resource-form').style('display', 'block');
  d3.select('#wizard-step8 .resource-interstitial').style('display', 'none');
  clearResourceForm(d3);
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

var setupResourceInterstitial = function(d3) {
  document.getElementById('wizard').className = 'minimized';
  d3.select('#wizard-step8 .resource-form').style('display', 'none');
  d3.select('#wizard-step8 .resource-interstitial').style('display', 'block');
  d3.selectAll('#wizard button.add-resource')
    .on('click', function(){ exports.nextStep(d3); });
  d3.selectAll('#wizard button.next-step')
    .on('click', function(){ doneWithResources = true; exports.nextStep(d3); });
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
    node.__parents__ = [];
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
    target.__parents__.push(source);
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

  // Step 8, adding resources, is a bit complicated.
  //
  // After adding a resource, there's a small sub-step, which I'm calling the
  // "interstitial" here, that just asks if the user wants to add more resources
  // or proceed to the next step. A good way to think about the interstitial is
  // that it floats at the end of all the resource data entry form sub-steps.
  //
  // In the normal, forward flow, Step 8 starts at the entry form for the first
  // resource, then goes to the interstitial, then, so long as the user wants to
  // add another resource, it goes to another entry form then another
  // interstitial. When the user clicks "next" in the interstitial (instead of
  // "add resource"), we go to step 9.
  //
  // In the backward flow, Step 9 goes to the interstitial. As before, "next"
  // goes to Step 9, and "add resource" goes to an empty form to add a new
  // resource. Back from the interstitial goes to an entry form prepopulated
  // with the last resource's data (for updating). Back from there goes to an
  // entry form prepopulated with the previous resource's data. Back from the
  // first resource's entry form goes to Step 7. Hitting "next" from any
  // resource other than the last will go directly to the next resource, without
  // any intervening interstitial.
  //
  // If the page is loaded when the user was last seen at Step 8, do the
  // interstitial.

  8: {
    // false if on an in-between "add more or continue?" interstitial:
    doingDataEntry: true,
    currentResource: null,

    enter: function(d3, direction) {
      doneWithResources = false;
      if (direction === 1) {
        this.currentResource = 0;
        this.doingDataEntry = true;
        setupResourceForm(d3, this.currentResource);
      } else {
        this.currentResource = nodesByType.resource.length - 1;
        this.doingDataEntry = false;
        setupResourceInterstitial(d3);
      }
    },

    subStepAdvance: function(d3) {
      if (this.doingDataEntry) {
        if (this.currentResource === nodesByType.resource.length) {
          // add new resource
          if (!upsertResource(d3, this.currentResource)) return true;
          this.doingDataEntry = false;
          setupResourceInterstitial(d3);
        } else {
          // update existing resource
          if (!upsertResource(d3, this.currentResource++)) return true;
          setupResourceForm(d3, this.currentResource);
        }
        return true;
      }

      // If we get this far, then we are advancing from the interstitial.
      if (doneWithResources) return false; // advance to next major step
      this.currentResource += 1;
      this.doingDataEntry = true;
      setupResourceForm(d3, this.currentResource);
      return true;
    },

    subStepRetreat: function(d3) {
      if (!this.doingDataEntry) {
        this.doingDataEntry = true;
        setupResourceForm(d3, this.currentResource);
        return true;
      }
      if (this.currentResource === 0) return false;
      setupResourceForm(d3, --this.currentResource);
      return true;
    }
  }
};

exports.initializeAtStep = function(d3) {
  exports.showStep(d3);
  var stepObj = steps[exports.currentStep] || {};
  if (stepObj.enter) stepObj.enter(d3, 0);
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
    exports.showStep(d3);
    stepObj = steps[exports.currentStep] || {};
    if (stepObj.enter) stepObj.enter(d3, 1);
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
  exports.showStep(d3);
  stepObj = steps[exports.currentStep] || {};
  if (stepObj.enter) stepObj.enter(d3, -1);
};
