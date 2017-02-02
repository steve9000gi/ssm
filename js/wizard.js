var modArrayUtils = require('./array-utils.js'),
    modCompletions = require('./completions.js'),
    modDatabase = require('./database.js'),
    modEntryList = require('./entry-list.js'),
    modEvents = require('./events.js'),
    modExport = require('./export.js'),
    modSelection = require('./selection.js'),
    modSerialize = require('./serialize.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modSvg = require('./svg.js'),
    modText = require('./text.js'),
    modUpdate = require('./update.js'),
    modZoom = require('./zoom.js');

exports.wizardActive = undefined;
exports.testDescription = undefined;
exports.focusDescription = undefined;
exports.focusContext = undefined;
exports.currentStep = 1;
exports.currentResponsibility = undefined;
exports.currentNeed = undefined;

var numSteps = 12;
var nodesByType = {
      'role': null,
      'responsibility': [],
      'need': [],
      'resource': [],
      'wish': []
    },
    shapesByType = {
      'role':           'circle',
      'responsibility': 'rectangle',
      'need':           'diamond',
      'resource':       'ellipse',
      'wish':           'star'
    },
    colorsByType = {
      'role':           '#8800ff', // purple
      'responsibility': '#0000ff', // blue
      'need':           '#00bdbd', // cyan
      'resource':       '#000000', // black
      'wish':           '#999900'  // gold
    },
    initialTranslate, initialZoom,
    // a flag to be set when user selects "continue" option from "add resources"
    // interstitial:
    doneWithResources;

var targetRadius = function(nodeType) {
  var ringNum = {
    'responsibility': 1,
    'need': 2,
    'resource': 3,
    'wish': 4
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
      nodeTypes = ['responsibility', 'need', 'resource', 'wish'];
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

// Returns [source, target].
var setEdgeDirection = function(d3, shape, oldNode, newNode) {
  var front, back;
  switch (newNode.shape) {
    case "circle":
    case "rectangle":
    case "diamond":
      return [oldNode, newNode]; // Arrow points out
    default:
      return [newNode, oldNode]; // Arrow points inward
  };
};

var addNode = function(d3, type, parent_s, text, edgeColor) {
  // parent_s might be single parent or an array of many parents
  var color = colorsByType[type],
      shape = shapesByType[type],
      newNode = modEvents.addNode(d3, 0, 0, text, color, shape),
      parents = [].concat(parent_s),
      multiParent = parents.length > 1,
      newEdge = function(src) { 
        var endNodes = setEdgeDirection(d3, shape, src, newNode);
          return {
            source: endNodes[0],
            target: endNodes[1],
            style: 'solid',
            color: edgeColor || '#000000',
            thickness: 3,
            name: ''
        };
      };
  if (type !== 'role') newNode.__parents__ = parents.slice(0);
  for (var i=0; i < parents.length; i++) {
    modEvents.addEdge(d3, newEdge(parents[i]));
    newNode.__parents__[i].__children__.push(newNode);
  }
  newNode.type = type;
  newNode.__children__ = [];
  if (type === 'role') nodesByType.role = newNode;
  else nodesByType[type].push(newNode);
  rebalanceNodes(d3);
  return newNode;
};

var updateNode = function(d3, type, indexAmongType, parent_s, text, edgeColor) {
  var node = nodesByType[type][indexAmongType],
      parents = [].concat(parent_s),
      parentGroups = modArrayUtils.venn(d3, node.__parents__, parents,
                                        function(d){ return d.name; }),
      newEdge = function(src) { return {
        source: src,
        target: node,
        style: 'solid',
        color: edgeColor || '#000000',
        thickness: 3,
        name: ''
      }; },
      i, arr, m;

  for (i=0, arr=parentGroups[0], m=arr.length; i<m; i++) {
    modEvents.removeEdge(arr[i], node);
  }
  for (i=0, arr=parentGroups[2], m=arr.length; i<m; i++) {
    modEvents.addEdge(d3, newEdge(arr[i]));
  }

  modSvg.links.filter(function(l){
    return parentGroups[1].indexOf(l.source) > -1 && l.target === node;
  });
  modSvg.links.filter(function(l){
    return parentGroups[1].indexOf(l.source) > -1 && l.target === node;
  }).map(function(l){
    modSvg.links[modSvg.links.indexOf(l)].color = edgeColor;
  });

  var d3element = modSvg.shapeGroups.filter(function(dval) {
    return dval.id === node.id;
  });
  node.name = text;
  modText.changeElementTextImmediately(d3, d3element, node, text);
  node.__parents__ = parents;
  rebalanceNodes(d3);
  return node;
};

var upsertNode = function(d3, type, indexAmongType, parent_s, text, edgeColor) {
  if (indexAmongType >= nodesByType[type].length) {
    return addNode(d3, type, parent_s, text, edgeColor);
  } else {
    return updateNode(d3, type, indexAmongType, parent_s, text, edgeColor);
  }
};

// If a resource already exists with the given number, update it; otherwise, add
// one at that number in `nodesByType.resource`. Return true if successful, or
// false if insufficient data entered in form.
var upsertResource = function(d3, resourceNumber) {
  var type = d3.select('input[name=resource_type]'),
      name = d3.select('input[name=resource_name]'),
      typeNode = type.node(),
      nameNode = name.node(),
      labelIndex = d3.select('select[name="resource_label_field"]')
        .node().selectedIndex,
      labelField = ['type', 'name'][labelIndex],
      nodeLabel = labelField === 'type' ? typeNode.value : nameNode.value,
      checkedNeedsSel = '#wizard-resource-needs input[type=checkbox]:checked',
      checkedParentNeeds = d3.selectAll(checkedNeedsSel),
      checkedHelpfulness = d3.select('input[name=helpfulness]:checked').node(),
      helpDescrip = d3.select('textarea[name=resource_helpfulness_description'),
      noType = type.node().value === '',
      noNeeds = checkedParentNeeds.size() === 0,
      noHelp = !checkedHelpfulness,
      badLabel = labelField === 'name' && !nameNode.value,
      errorSel;

  type.transition(0.5)
    .style('border', noType ? '1px solid red' : null)
    .style('background-color', noType ? '#ffa' : null);
  errorSel = d3.select('#wizard-resource-type-error')
    .text(noType ? 'Please enter a resource type.' : '')
    .style('color', noType ? '#a00' : null);
  if (noType) errorSel.append('br');
  else errorSel.selectAll('br').remove();

  d3.select('#wizard-resource-needs')
    .transition(0.5)
    .style('border', noNeeds ? '1px solid red' : null);
  errorSel = d3.select('#wizard-resource-needs-error')
    .text(noNeeds ? 'Please select at least one related need.' : '')
    .style('color', noNeeds ? '#a00' : null);
  if (noNeeds) errorSel.append('br');
  else errorSel.selectAll('br').remove();

  d3.select('#wizard-resource-helpfulness-radio-group')
    .transition(0.5)
    .style('border', noHelp ? '1px solid red' : null);
  errorSel = d3.select('#wizard-resource-helpfulness-error')
    .text(noHelp ? 'Please select one option below.' : '')
    .style('color', noHelp ? '#a00' : null);
  if (noHelp) errorSel.append('br');
  else errorSel.selectAll('br').remove();

  errorSel = d3.select('#wizard-resource-label-error')
    .text(badLabel ? "You can't have an empty label. Either use 'type' as the label or fill in a name above." : '')
    .style('color', badLabel ? '#a00' : null);
  if (badLabel) errorSel.append('br');
  else errorSel.selectAll('br').remove();

  if (noType || noNeeds || noHelp || badLabel) return false;

  var helpfulness = checkedHelpfulness.value,
      edgeColor = helpfulness === 'helpful' ? '#00bd00'
        : helpfulness === 'not-helpful' ? '#ff0000'
        : '#000000',
      parents = [];

  checkedParentNeeds.each(function(){
    // A name might be `a2_3`, for example.
    var indexes = d3.select(this).attr('name').slice(1).split('_'),
        resp = nodesByType.responsibility[indexes[0]];
    parents.push(resp.__children__[indexes[1]]);
  });

  var newNode = upsertNode(d3, 'resource', resourceNumber, parents,
                           nodeLabel, edgeColor),
      hdNode = helpDescrip.node();

  newNode.helpfulness = helpfulness;
  newNode.labelField = labelField;
  newNode.generalName = typeNode.value;
  if (nameNode) {
    newNode.specificName = nameNode.value;
  } else {
    delete newNode.specificName;
  }
  if (hdNode) {
    newNode.helpfulnessDescription = hdNode.value;
  } else {
    delete newNode.helpfulnessDescription;
  }

  modDatabase.writeMapToDatabase(d3, true);
  return true;
};

var upsertWish = function(d3, wishNumber) {
  var root = d3.select('#wizard-step11'),
      name = root.select('input[name=wish_name]').property('value'),
      parentTypeSel = root.select('input[name=wish_parent_type]:checked'),
      parentType = parentTypeSel.empty() ? null
        : parentTypeSel.property('value'),
      selectNode = root.select('select').node(),
      selectedIdx = selectNode && selectNode.selectedIndex,
      // subtract 1 because of the empty first option:
      parentNode = selectedIdx ? nodesByType[parentType][selectedIdx - 1] : null,
      descrip = root.select('textarea').property('value');

  d3.select('#wizard-wish-name-error')
    .text(name ? '' : 'Please enter a wish name.');
  d3.select('#wizard-wish-parent-type-error')
    .text(parentType ? '' : 'Please make a selection.');
  d3.select('#wizard-wish-parent-node-error')
    .text(parentNode ? '' : 'Please make a selection.');
  if (!name || !parentType || !parentNode) return false;

  var newNode = upsertNode(d3, 'wish', wishNumber, parentNode, name);
  if (parentType === 'resource') newNode.resourceDescription = descrip;
  else delete newNode.resourceDescription;
  modDatabase.writeMapToDatabase(d3, true);
  return true;
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
  var existingTexts = responsibility.__children__
        .filter(function(d) {return d.type === 'need';})
        .map(function(d) {return d.name;});
  modEntryList.teardown(d3, selector);
  modEntryList.setup(d3, selector, existingTexts,
                     modCompletions.completionsByType().need,
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
  d3.select('#wizard-step9 input[name=resource_type]').property('value', '');
  d3.select('#wizard-step9 input[name=resource_name]').property('value', '');
  d3.select('#resource-type-completions').selectAll('option').remove();
  d3.select('#wizard-resource-needs').selectAll('div').remove();
  d3.selectAll('#wizard-step9 input[name=helpfulness]:checked')
    .property('checked', false);
  d3.select('#wizard-step9 textarea').property('value', '');
};

var populateResourceForm = function(d3, resource) {
  d3.select('#wizard-step9 input[name=resource_type]')
    .property('value', resource.generalName);
  d3.select('#wizard-step9 input[name=resource_name]')
    .property('value', resource.specificName);
  var selectNode = d3.select('select[name="resource_label_field"]').node();
  selectNode.selectedIndex = resource.labelField === 'type' ? 0 : 1;
  d3.select('#wizard-resource-needs')
    .selectAll('div.wizard-need-group')
    .selectAll('label')
    .select('input')
    .property('checked', function(d,i,j){
      return resource.__parents__.indexOf(d) !== -1;
    });
  d3.select('#wizard-step9 input[name=helpfulness][value="' +
            resource.helpfulness + '"]')
    .property('checked', true);
  d3.select('#wizard-step9 textarea')
    .property('value', resource.helpfulnessDescription);
};

var setupResourceForm = function(d3, resourceNum) {
  document.getElementById('wizard').className = 'open';
  d3.select('#wizard-step9 .resource-form').style('display', 'block');
  d3.select('#wizard-step9 .resource-interstitial').style('display', 'none');
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
        .data(function(d){
          return d.__children__.filter(function(c){return c.type === 'need';});
        })
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
  labels.append('br');
  d3.select('#resource-type-completions')
    .selectAll('option')
    .data(modCompletions.completionsByType().resource)
    .enter().append('option')
    .attr('value', String);
  if (resourceNum < nodesByType.resource.length) {
    populateResourceForm(d3, nodesByType.resource[resourceNum]);
  }
};

var setupResourceInterstitial = function(d3) {
  document.getElementById('wizard').className = 'small';
  d3.select('#wizard-step9 .resource-form').style('display', 'none');
  d3.select('#wizard-step9 .resource-interstitial').style('display', 'block');
  d3.selectAll('#wizard button.add-resource')
    .on('click', function(){ exports.nextStep(d3); });
  d3.selectAll('#wizard button.next-step')
    .on('click', function(){ doneWithResources = true; exports.nextStep(d3); });
};

var setupWishFormParentList = function(d3, parentType) {
  d3.select('#wizard-step11 span.wish-parent-type').text(parentType);
  d3.select('#wizard-step11 div.wish-parent-selection')
    .style('display', 'block');
  d3.select('div.wish-parent-list').selectAll('*').remove();
  var select = d3.select('#wizard-step11 div.wish-parent-list')
        .append('select')
        .attr('name', 'wish_parent_node_index');
  var options = select.selectAll('option')
        .data([null].concat(nodesByType[parentType]))
        .enter().append('option')
        .attr('value', function(d,i){ return d ? i : null; })
        .text(function(d){ return d ? d.name : ''; });
  d3.select('#wizard-step11 div.wish-resource-description')
    .style('display', parentType === 'resource' ? 'block' : 'none');
};

var setupWishForm = function(d3, wishNum) {
  var root = d3.select('#wizard-step11'),
      wish = wishNum < nodesByType.wish.length && nodesByType.wish[wishNum],
      name = wish && wish.name,
      parent = wish && wish.__parents__[0],
      parentType = wish && parent.type,
      parentIndex = wish && nodesByType[parentType].indexOf(parent),
      descrip = wish && wish.resourceDescription;
  root.select('span.wish-number').text(wishNum + 1);
  root.select('input[name=wish_name]').property('value', name || '');
  root.select('#wish-completions')
    .selectAll('option')
    .data(modCompletions.completionsByType().wish)
    .enter().append('option')
    .attr('value', String);
  root.select('textarea').property('value', descrip || '');
  root.select('div.wish-parent-list').selectAll('*').remove();
  root.selectAll('input[name=wish_parent_type]')
    .property('checked', false)
    .on('click', function(){
      setupWishFormParentList(d3, d3.select(this).property('value'));
    });
  if (parentType) {
    root.selectAll('input[name=wish_parent_type][value=' + parentType + ']')
      .property('checked', true);
    setupWishFormParentList(d3, parentType);
    root.select('select').selectAll('option')
      .property('selected', function(d,i){
        return i === parentIndex + 1;
      });
  }
};

var guardedClose = function(d3) {
  var confirmText = 'Are you sure you want to close the wizard? ' +
        '(This action cannot be undone.)';
  if (window.confirm(confirmText)) {
    exports.hideWizard(d3);
  }
};

var attachButtonHandlers = function(d3) {
  d3.selectAll('#wizard div.close')
    .on('click', function(){ guardedClose(d3); });
  d3.selectAll('#wizard div.minimize')
    .on('click', function(){
      document.getElementById('wizard').className = 'minimized';
      d3.selectAll('#wizard div.maximize').style('display', 'block');
      d3.selectAll('#wizard div.minimize').style('display', 'none');
    });
  d3.selectAll('#wizard div.maximize')
    .on('click', function(){
      document.getElementById('wizard').className = 'open';
      d3.selectAll('#wizard div.maximize').style('display', 'none');
      d3.selectAll('#wizard div.minimize').style('display', 'block');
    });
  d3.selectAll('#wizard button.next')
    .on('click', function(){ exports.nextStep(d3); });
  d3.selectAll('#wizard button.back')
    .on('click', function(){ exports.prevStep(d3); });
  d3.selectAll('#wizard button.finish')
    .on('click', function(){
      exports.hideWizard(d3);
      modDatabase.writeMapToDatabase(d3, true);
    });
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

exports.showWizard = function(d3, subStepState) {
  document.getElementById('wizard').className = 'open';
  document.getElementById('toolbox').style.visibility = 'hidden';
  d3.selectAll('#wizard div.maximize').style('display', 'none');
  d3.selectAll('#wizard div.minimize').style('display', 'block');
  exports.wizardActive = true;
  exports.initializeAtStep(d3, subStepState);
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
      steps[exports.currentStep].isSmall) {
    document.getElementById('wizard').className = 'small';
  } else {
    document.getElementById('wizard').className = 'open';
  }
  attachButtonHandlers(d3);
};

var steps = {
  // Note: uninteresting steps are omitted here.
  1: {
    enter: function(d3) {
      var activeWizEl = d3.selectAll('#wizard .wizard-step')
            .filter(function(){ return this.style.display === 'block'; })
            .node(),
          wizHeight = activeWizEl.clientHeight,
          body = document.body,
          bodyHeight = body.clientHeight,
          bodyWidth = body.clientWidth,
          mapHeight = bodyHeight - wizHeight,
          mapWidth = bodyWidth,
          contentSize = 2 * modSystemSupportMap.ringRadii[3] + 80,
          newZoom = Math.min(mapHeight, mapWidth) / contentSize,
          outerCircle = d3.select('circle.ssmCircle[r="675"]'),
          centerX = outerCircle.attr('cx') * newZoom,
          centerY = outerCircle.attr('cy') * newZoom,
          newX = mapWidth / 2,
          newY = wizHeight + mapHeight / 2,
          xlate = [newX - centerX, newY - centerY];
      initialTranslate = modZoom.translate;
      initialZoom = modZoom.zoom;
      modZoom.setZoom(d3, xlate, newZoom);
      modZoom.setup(d3, modSvg.svg);
      return true;
    }
  },

  2: {
    enter: function(d3) {
      if (exports.state) {
	d3.select("#state-select").node().value = exports.state;
      }
      if (exports.county) {
        document.getElementById("county").value = exports.county;
      }
      // 2do: handle race import
      //
      if (exports.language) {
        var checkedLanguageButton = 'input[name=language-button]:checked';
        d3.select(checkedLanguageButton).node().value = exports.language;
      }
      if (exports.age) {
        var checkedAgeButton = 'input[name=age-button]:checked';
        d3.select(checkedAgeButton).node().value = exports.age;
      }
      if (exports.insurance) {
        var checkedInsuranceButton = 'input[name=insurance-button]:checked';
        d3.select(checkedInsuranceButton).node().value = exports.insurance;
      }

      return true;
    },

    exit: function(d3) {
      var stateSel = document.getElementById('state-select');
      var state = stateSel.options[stateSel.selectedIndex].value
      var countyText = document.getElementById("county").value;

      var americanIndian = document.getElementById('AmericanIndian').checked;
      var white = document.getElementById('White').checked;
      var asian = document.getElementById('Asian').checked;
      var black = document.getElementById('Black').checked;
      var hawaiian = document.getElementById('Hawaiian').checked;
      var otherRace = document.getElementById('OtherRace').checked;
      var otherRaceText = document.getElementById('OtherRaceText').value;
      var races = Array();
      if (americanIndian) races.push("American Indian");
      if (white) races.push("White");
      if (asian) races.push("Asian");
      if (black) races.push("African American/Black");
      if (hawaiian) races.push("Hawaiian or Pacific Islander");
      if (otherRace) races.push(otherRaceText);

      var hispanic = document.getElementById('isHispanic').checked;
      var languageButton = d3.select('input[name=language-button]:checked');
      var language = languageButton.node() ? languageButton.node().value : null;
      if (language == "OtherLanguage") {
	var otherLanguageText = document.getElementById('OtherLanguageText').value;
        language = otherLanguageText;	
      }
      var ageButton = d3.select('input[name=age-button]:checked');
      var age = ageButton.node() ? ageButton.node().value : null;
      var insuranceButton = d3.select('input[name=insurance-button]:checked');
      var insurance = insuranceButton.node() ? insuranceButton.node().value : null;
      if (insurance == "OtherInsurance") {
	var otherInsuranceText = document.getElementById('OtherInsuranceText').value;
        insurance = otherInsuranceText;	
      }

      var otherHealthConditionText = document.getElementById('OtherHealthConditionText').value;
      var healthConditions = Array();
      d3.selectAll(".healthChkBox")
        .each(function(d, i) {
          if (this.checked) {
            if (this.value == "Other") {
              healthConditions.push(otherHealthConditionText);
            } else {
              healthConditions.push(this.value);
            }
          }
      });

      if (!(state && countyText && races && language && age && insurance)) {
        alert('You must answer all questions before proceeding.');
        return false;
      }
      exports.state = state;
      exports.county = countyText;
      exports.race = races;
      exports.hispanic = hispanic;
      exports.language = language;
      exports.age = age;
      exports.insurance = insurance;
      exports.healthConditions = healthConditions;
      return true;
    }
  },

  4: {
    enter: function(d3) {
      var sel;
      if (exports.focusDescription) {
  - 'If you have multiple roles that you want to explore, pick one. Each map is designed to look at one role and one role only. You can come back and fill out other maps for other roles later.'
        sel = 'textarea[name=prereqs_focus_description]';
        d3.select(sel).node().value = exports.focusDescription;
      }
      if (exports.focusContext) {
        sel = 'textarea[name=prereqs_context]';
        d3.select(sel).node().value = exports.focusContext;
      }
      return true;
    },

    exit: function(d3) {
      var sel = 'textarea[name=prereqs_focus_description]',
          focusText = d3.select(sel).node().value,
          sel2 = 'textarea[name=prereqs_context]',
          contextText = d3.select(sel2).node().value;
      if (!focusText || !contextText) {
        alert('You must answer both questions before proceeding.');
        return false;
      }
      exports.focusDescription = focusText;
      exports.focusContext = contextText;
      return true;
    }
  },

  5: {
    enter: function(d3) {
      // If we didn't transit step 1 in this page load, initialTranslate and
      // initialZoom will be unset, so use default values.
      modZoom.setZoom(d3, initialTranslate || 0, initialZoom || 1);
      modZoom.setup(d3, modSvg.svg);
      if (nodesByType.role) {
        d3.select('input[name=role]').node().value = nodesByType.role.name;
      }
      d3.select('#wizard-step4_datalist').selectAll('option')
        .data(modCompletions.completionsByType().role)
        .enter().append('option')
        .attr('value', String);
      return true;
    },

    exit: function(d3) {
      var text = d3.select('input[name=role]').node().value;
      if (!text) {
        alert('You must enter a role before proceeding.');
        return false;
      }
      addNode(d3, 'role', [], text);
      d3.select('#wizard_role_text').text(text);
      return true;
    }
  },

  6: {
    enter: function(d3) {
      console.log("6: enter");
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
      var existingTexts = nodesByType.responsibility
            .filter(function(d) {return d.type === 'responsibility';})
            .map(function(d) {return d.name;});
      modEntryList.setup(d3, selector, existingTexts,
                         modCompletions.completionsByType().responsibility,
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

  7: {
    enter: function(d3, direction, subStepState) {
      if (direction === 0) {
        exports.currentResponsibility =
          (subStepState && subStepState.currentResponsibility) || 0;
      } else if (direction === 1) {
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

    getSubStepState: function(d3) {
      return {currentResponsibility: exports.currentResponsibility};
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

  8: { isSmall: true },

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

  9: {
    // false if on an in-between "add more or continue?" interstitial:
    doingDataEntry: true,
    currentResource: null,

    enter: function(d3, direction, subStepState) {
      if (direction === 0) {
        doneWithResources = subStepState.doneWithResources;
        this.currentResource = subStepState.currentResource;
        this.doingDataEntry = subStepState.doingDataEntry;
        if (this.doingDataEntry) setupResourceForm(d3, this.currentResource);
        else setupResourceInterstitial(d3);
      } else if (direction === 1) {
        doneWithResources = false;
        this.currentResource = 0;
        this.doingDataEntry = true;
        setupResourceForm(d3, this.currentResource);
      } else {
        doneWithResources = false;
        this.currentResource = nodesByType.resource.length - 1;
        this.doingDataEntry = false;
        setupResourceInterstitial(d3);
      }
    },

    getSubStepState: function(d3) {
      return {
        doingDataEntry: this.doingDataEntry,
        currentResource: this.currentResource,
        doneWithResources: doneWithResources
      };
    },

    subStepAdvance: function(d3) {
      if (this.doingDataEntry) {
        var numResources = nodesByType.resource.length;
        if (!upsertResource(d3, this.currentResource)) return true;
        if (this.currentResource >= numResources - 1) {
          // We either just added a new resource or just updated the last one.
          // In either case, go to the interstitial.
          this.doingDataEntry = false;
          setupResourceInterstitial(d3);
        } else {
          // We just updated a resource other than the last one. Edit the next
          // one.
          this.currentResource += 1;
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
  },

  10: { isSmall: true },

  11: {
    currentWish: null,

    enter: function(d3, direction, subStepState) {
      if (direction === 0) {
        this.currentWish = subStepState.currentWish;
      } else if (direction === 1) {
        this.currentWish = 0;
      } else {
        this.currentWish = Math.max(0, nodesByType.wish.length - 1);
      }
      setupWishForm(d3, this.currentWish);
    },

    getSubStepState: function(d3) {
      return {currentWish: this.currentWish};
    },

    subStepAdvance: function(d3) {
      if (!upsertWish(d3, this.currentWish)) return true;
      if (this.currentWish === 2) return false;
      this.currentWish += 1;
      setupWishForm(d3, this.currentWish);
      return true;
    },

    subStepRetreat: function(d3) {
      if (this.currentWish === 0) return false;
      this.currentWish -= 1;
      setupWishForm(d3, this.currentWish);
      return true;
    }
  },

  12: {
    enter: function(d3) {
      d3.select('#wizard-download-map-data')
        .on('click', function(){
          var json = window.JSON.stringify(modSerialize.getMapObject(d3)),
              blob = new window.Blob(
                [json], {type: "text/plain;charset=utf-8"});
          window.saveAs(blob, "SystemSupportMap.json");
        });
      d3.select('#wizard-download-map-image')
        .on('click', function(){
          modExport.exportGraphAsImage(d3);
        });
      d3.select('#wizard-step11-map-id')
        .text(modDatabase.id);
    }
  }
};

exports.initializeAtStep = function(d3, subStepState) {
  exports.showStep(d3);
  var stepObj = steps[exports.currentStep] || {};
  if (stepObj.enter) stepObj.enter(d3, 0, subStepState);
};

exports.nextStep = function(d3) {
  var stepObj = steps[exports.currentStep] || {};
  if (stepObj.subStepAdvance && stepObj.subStepAdvance(d3)) {
    // The current step isn't ready to move on to the next step.
    modDatabase.writeMapToDatabase(d3, true);
    return;
  }
  // A step can prevent advancement by returning something falsy from `exit`.
  if (!stepObj.exit || stepObj.exit(d3)) {
    exports.currentStep++;
    exports.showStep(d3);
    stepObj = steps[exports.currentStep] || {};
    if (stepObj.enter) stepObj.enter(d3, 1);
    modDatabase.writeMapToDatabase(d3, true);
  }
};

exports.prevStep = function(d3) {
  var stepObj = steps[exports.currentStep] || {};
  if (stepObj.subStepRetreat && stepObj.subStepRetreat(d3)) {
    // The current step isn't ready to move on to the previous step.
    modDatabase.writeMapToDatabase(d3, true);
    return;
  }
  if (stepObj.exit) stepObj.exit(d3);
  exports.currentStep--;
  exports.showStep(d3);
  stepObj = steps[exports.currentStep] || {};
  if (stepObj.enter) stepObj.enter(d3, -1);
  modDatabase.writeMapToDatabase(d3, true);
};

exports.getCurrentSubStepState = function(d3) {
  var stepObj = steps[exports.currentStep] || {},
      fn = stepObj.getSubStepState;
  return fn ? fn.call(stepObj, d3) : null;
};
