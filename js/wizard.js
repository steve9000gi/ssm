var modEvents = require('./events.js'),
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
  <input type="text" />\
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
  <input type="text" />\
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
  <input type="text" />\
</label>\
<br/>\
This resource was:\
<br/>\
<label>\
  <input type="radio" name="helpfulness" /> Helpful\
</label>\
<br/>\
<label>\
  <input type="radio" name="helpfulness" /> Somewhat helpful\
</label>\
<br/>\
<label>\
  <input type="radio" name="helpfulness" /> Not helpful\
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
];

var attachButtonHandlers = function(d3) {
  d3.select('#wizard button.next')
    .on('click', function(){ exports.nextStep(d3); });
  d3.select('#wizard button.back')
    .on('click', function(){ exports.prevStep(d3); });
  d3.select('#wizard button.finish')
    .on('click', exports.hideWizard);

  d3.select('#wizard button.add-role-next')
    .on('click', function() {
      var text = d3.select('input[name=role]').node().value,
          center = modSystemSupportMap.center,
          node = modEvents.addNode(d3, center.x, center.y, text);
      nodesByType.role = node;
      exports.nextStep(d3);
    });
  d3.select('#wizard button.add-responsibility')
    .on('click', function(){console.log('imagine that a responsibility was just added');});
  d3.select('#wizard button.add-need')
    .on('click', function(){console.log('imagine that a need was just added');});
  d3.select('#wizard button.add-resource')
    .on('click', function(){console.log('imagine that a resource was just added');});
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
  step -= 1;
  exports.showStep(d3);
};

exports.nextStep = function(d3) {
  step += 1;
  exports.showStep(d3);
};
