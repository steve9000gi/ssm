var debugName = 'need1.3';
var modEvents = require('./events.js'),
    modSelection = require('./selection.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modSvg = require('./svg.js'),
    modText = require('./text.js'),
    modUpdate = require('./update.js');

var nodesByType = {
      'role': null,
      'responsibility': [],
      'need': [],
      'resource': []
    },
    step = 0,
    curResponsibility,
    curNeed,
    stepHtml = [
  // step 1: introduction
  '\
<h1>Welcome to the SSM wizard</h1>\
<p>Hi, I&rsquo;m the SSM wizard. I&rsquo;m here to help. I will guide you through the process of creating a system support map. When you answer my questions, I will create your map for you.</p>\
<p>What is a system support map, you ask? It&rsquo;s a way of visualizing a system of support. For example, a map for a parent of a special needs child would include their responsibilities for their child, the needs they have to fulfill those responsibilities, and the resources that help them meet those needs.</p>\
<p>Note: it can take a while to create a map, even with my help! You should expect to take between 30 and 60 minutes for this. If you need to take a break, you can save your work and come back to it later.</p>\
<p>Sound complicated? Don&rsquo;t worry. I&rsquo;ll guide you through the process, step by step.</p>\
<p>Hit the &ldquo;Next&rdquo; button to continue.</p>\
<button class="next">Next</button>',

  // step 2: prerequisites
  '\
<aside>\
  <h3>Examples of systems mapped by SSM</h3>\
  <ul>\
    <li>Supporting a child/children with special health care needs and/or developmental disabilities;</li>\
    <li>Above, but in a specific life-course (i.e., transition to adulthood);</li>\
    <li>Family outcomes in the 3 months post-partum;</li>\
    <li>The social-emotional health of a child/children;</li>\
    <li>Migraine self-management;</li>\
    <li>Community-academic partnerships working to improve population health;</li>\
    <li>Efforts to address isolation among individuals in a community;</li>\
    <li>Efforts to increase inter-generational cohesion in a community;</li>\
    <li>And, efforts to reconnect with one’s landscape/environment.</li>\
  </ul>\
</aside>\
<h1>Prerequisites</h1>\
<p>Before we begin, you should have a clear idea of the system you want to describe.</p>\
<p>This is important! If you don&rsquo;t have a solid understanding of the system, this exercise will most likely be unclear, unhelpful, overwhelming, and even frustrating.</p>\
<p>If you have multiple roles that you want to study, pick one. Each map is for one role, and one role only. You can come back and fill out other maps for other roles later, if you want.</p>\
<p>If you need inspiration, check the sidebar for some examples of systems mapped by people.</p>\
<p>Hit the &ldquo;Next&rdquo; button to continue.</p>\
<button class="back">Back</button>\
<button class="next">Next</button>',

  // step 3: overview
  '\
<h1>Overview</h1>\
<p>What will we be doing? Here&rsquo;s a quick overview of the process.</p>\
<p>Take a look at the chart below. Notice the concentric rings, and the labels for each ring.</p>\
<p>We&rsquo;re going to be building your system support map step-by-step, starting at the innermost ring and working our way outwards.</p>\
<p>Intimidated by the complicated-looking controls at the bottom left? Don&rsquo;t worry. You don&rsquo;t have to know anything about them. Those controls are for advanced users who want to create their map themselves. You won&rsquo;t need to use them if you stick with me.</p>\
<p>Hit the &ldquo;Next&rdquo; button to continue.</p>\
<button class="back">Back</button>\
<button class="next">Next</button>',

  // step 4: role
  '\
<h1>Identifying your role</h1>\
<p>What role do you play in this system? Are you a patient, a family member, a teacher, an organizational leader, a legislator, a community member, or what?</p>\
<p>Remember, each map is intended to describe one role. If you have multiple roles you would like to map, please pick one. You can study the other ones later, after you finish the map for this one. I&rsquo;ll be ready for you.</p>\
<label>My role is:\
  <input type="text" name="role" />\
</label>\
<p>When you hit &ldquo;Next&rdquo;, pay attention to the chart below. I will create your role in the chart for you. You&rsquo;re welcome.</p>\
<p>Hit the &ldquo;Next&rdquo; button to continue.</p>\
<button class="back">Back</button>\
<button class="add-role-next">Next</button>',

  // step 5: responsibilities
  '\
<aside>Pro-tip: some people find it useful to describe objectives or goals instead of responsibilities in the second ring. You can do that if you want. Just remember that you did, so that you&rsquo;re not confused when I talk about responsibilities in the next steps!</aside>\
<h1>Responsibilities</h1>\
<p>Now let&rsquo;s look at the second ring, which will contain the responsibilities that you have in this role.</p>\
<p>So, in your role as <span id="wizard_role_text">_____</span>, what do you see as your main responsibilities? Identify the most important 4&ndash;8 responsibilities, and add them here.</p>\
<p>When you click the &ldquo;Add&rdquo; button below, I will add it to the chart below. Then you can add another responsibility, or click the &ldquo;Next&rdquo; button to go to the next step.</p>\
<label>I have a responsibility to:\
  <input type="text" name="responsibility" />\
</label>\
<button class="add-responsibility">Add</button>\
<br/>\
<button class="back">Back</button>\
<button class="next">Next</button>',

  // step 6: needs
  '\
<h1>Needs</h1>\
<p>The third ring is for needs. What do you need to meet each responsibility? Think about this as a recipe. To meet one of these responsibilities, what ingredients would you need? Common responses include time, money, reimbursement, buy-in from my organization, information, etc. Please be creative here! It helps if this list is complete. Also consider internal needs, like patience, empathy, energy, creativity, etc.</p>\
<p>Note that these should be general needs. I don&rsquo;t need to know that you need to do laundry tomorrow!</p>\
<p>Here is an example for a parent of a child with special health care needs supporting the physical health of their child: a doctor who &ldquo;gets&rdquo; us (my daughter and our family) and who is open in the evenings or weekends, child care for my other kids, transportation, and money for the copayment.</p>\
<p>I&rsquo;ll ask about each responsibility in turn, starting with the first one you told me about.</p>\
<h3>Responsibility <span id="wizard_current_responsibility_number">_</span> of <span id="wizard_responsibility_count">_</span>: <span id="wizard_current_responsibility_text">____</span></h3>\
<label>To fulfill this responsibility, I need:\
  <input type="text" name="need" />\
</label>\
<button class="add-need">Add</button>\
<br/>\
<button class="back">Back</button>\
<button class="next">Next</button>',

  // step 7: resources
  '\
<h1>Resources</h1>\
<p>The next step is to think about the needs you listed. Are there any specific resources that you have tried (whether or not they have helped you) to get that need met? What supports you? If needs were ingredients in a recipe, resources might include things like a favorite recipe, particular brands of an ingredient, a store that sells many ingredients on your list, etc. Resources for your map might include websites, brochures, training programs and classes, organizations in your community, providers, books you read to build a skill in yourself (e.g., communication skills, mindfulness, the ability to relax).</p>\
<p>I also want to know about your experience with each resource. Did it help you? Why or why not&mdash;what about the resource worked or didn’t work? I will color-code your resources based on their helpfulness to you.</p>\
<p>I&rsquo;ll ask about each need in turn, starting with the first one you told me about.</p>\
<h3>Need <span id="wizard_current_need_number">_</span> of <span id="wizard_need_count">_</span>: <span id="wizard_current_need_text">____</span></h3>\
<label>A resources that will help meet this need is:\
  <input type="text" name="resource" />\
</label>\
<br/>\
This resource was:\
<br/>\
<label>\
  <input type="radio" name="helpfulness" value="helpful" /> Helpful\
</label>\
<br/>\
<label>\
  <input type="radio" name="helpfulness" value="somewhat-helpful" /> Somewhat helpful\
</label>\
<br/>\
<label>\
  <input type="radio" name="helpfulness" value="not-helpful" /> Not helpful\
</label>\
<br/>\
<button class="add-resource">Add</button>\
<br/>\
<button class="back">Back</button>\
<button class="next">Next</button>',

  // step 8: review
  '\
<h1>Review</h1>\
<p>We&rsquo;re done! When you click the &ldquo;Finish&rdquo; button, I&rsquo;ll go away and let you view or print your fancy new map.</p>\
<p>If you&rsquo;re feeling ambitious, you can try to add wishes on the outside of the rings, connecting them with whatever makes sense.</p>\
<p>If you ever want to see me again, even for a map that you&rsquo;ve already finished, you can! Just click on the "Options" menu in the toolbox.</p>\
<button class="back">Back</button>\
<button class="finish">Finish</button>'
    ],
    forceLayout,
    drawForceLayoutTransition = true;

var addRoleThenNext = function(d3) {
  var text = d3.select('input[name=role]').node().value,
      center = modSystemSupportMap.center,
      node = modEvents.addNode(d3, center.x, center.y, text);
  node.type = 'role';
  node.children = [];
  nodesByType.role = node;
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
  newNode.parent = parent;
  newNode.parent.children.push(newNode);
  newNode.children = [];
  nodesByType[type].push(newNode);
  return newNode;
};

var addResponsibility = function(d3) {
  var inputEl = d3.select('input[name=responsibility]').node();
  addNode(d3, 'responsibility', nodesByType.role, inputEl.value);
  inputEl.value = '';
};

var addNeed = function(d3) {
  var inputEl = d3.select('input[name=need]').node(),
      parent = nodesByType.responsibility[curResponsibility];
  addNode(d3, 'need', parent, inputEl.value);
  inputEl.value = '';
};

var addResource = function(d3) {
  var inputEl = d3.select('input[name=resource]').node(),
      helpfulness = d3.select('input[name=helpfulness]:checked').node().value,
      parent = nodesByType.need[curNeed],
      newNode = addNode(d3, 'resource', parent, inputEl.value);
  inputEl.value = '';
  d3.selectAll('input[name=helpfulness]').property('checked', false);
  newNode.helpfulness = helpfulness;
};

var highlightResponsibility = function(d3, responsibilityNumber) {
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
  d3.select('#wizard button.next')
    .on('click', function(){ exports.nextStep(d3); });
  d3.select('#wizard button.back')
    .on('click', function(){ exports.prevStep(d3); });
  d3.select('#wizard button.finish')
    .on('click', function(){ exports.hideWizard(d3); });
  d3.select('#wizard button.add-role-next')
    .on('click', function(){ addRoleThenNext(d3); });
  d3.select('#wizard button.add-responsibility')
    .on('click', function(){ addResponsibility(d3); });
  d3.select('#wizard button.add-need')
    .on('click', function(){ addNeed(d3); });
  d3.select('#wizard button.add-resource')
    .on('click', function(){ addResource(d3); });
};

exports.showWizard = function(d3) {
  document.getElementById('wizard').className = 'open';
  exports.showStep(d3);
  modUpdate.updateWindow(d3);
};

exports.hideWizard = function(d3) {
  document.getElementById('wizard').className = 'closed';
  modUpdate.updateWindow(d3);
};

exports.showStep = function(d3) {
  document.getElementById('wizard').innerHTML = stepHtml[step];
  attachButtonHandlers(d3);
};

exports.prevStep = function(d3) {
  // TODO: implement reverse logic as nextStep()
  step -= 1;
  exports.showStep(d3);
};

exports.nextStep = function(d3) {
  // TODO: clean this up. State machine?
  if (step === 5 && ++curResponsibility !== nodesByType.responsibility.length) {  // adding needs
    highlightResponsibility(d3, curResponsibility);
    return;
  }
  if (step === 6 && ++curNeed !== nodesByType.need.length) {
    highlightNeed(d3, curNeed);
    return;
  }
  step += 1;
  exports.showStep(d3);
  if (step === 5) {
    curResponsibility = 0;
    highlightResponsibility(d3, curResponsibility);
  } else if (step === 6) {
    curNeed = 0;
    highlightNeed(d3, curNeed);
  }
};
