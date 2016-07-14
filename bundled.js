(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.union = function(d3, a, b, acc) {
  var a2 = acc ? a.map(acc) : a,
      b2 = acc ? b.map(acc) : b,
      arr = a.slice(0),
      set = d3.set(a2);
  for (var i=0, m=b2.length; i<m; i++) {
    if (!set.has(b2[i])) arr.push(b[i]);
  }
  return arr;
};

exports.intersection = function(d3, a, b, acc) {
  var a2 = acc ? a.map(acc) : a,
      b2 = acc ? b.map(acc) : b,
      arr = [],
      set = d3.set(a2);
  for (var i=0, m=b2.length; i<m; i++) {
    if (set.has(b2[i])) arr.push(b[i]);
  }
  return arr;
};

exports.difference = function(d3, a, b, acc) {
  var a2 = acc ? a.map(acc) : a,
      b2 = acc ? b.map(acc) : b,
      arr = [],
      set = d3.set(b2);
  for (var i=0, m=a.length; i<m; i++) {
    if (!set.has(a2[i])) arr.push(a[i]);
  }
  return arr;
};

// Return an array containing 3 things:
// 0. items unique to first array
// 1. items common to both arrays (i.e. the intersection)
// 2. items unique to second array
exports.venn = function(d3, a, b, acc) {
  return [
    exports.difference(d3, a, b, acc),
    exports.intersection(d3, a, b, acc),
    exports.difference(d3, b, a, acc),
  ];
};

},{}],2:[function(require,module,exports){
var modBackend = require('./backend.js');

// Check whether we're authenticated at the backend, and call the callback
// with the boolean result (i.e. true = authenticated, false = not).
var checkAuthentication = function(d3, callback) {
  d3.xhr(modBackend.backendBase + '/testauth')
    .on('beforesend', function(request) { request.withCredentials = true; })
    .get(function(error, data) {
      if (error) {
        callback(false);
      } else {
        var message = JSON.parse(data.response).message;
        if (message === 'authenticated') {
          callback(true);
        } else {
          callback(false);
        }
      }
    });
};

// Render the registration (i.e. "new user") form and call the callback when
// the user is created.
var renderRegistrationForm = function(d3, callback) {
  var content = d3.select('#authentication .content');
  content.selectAll('*').remove();
  var header = content
    .append('h1')
    .text('Create a new account');
  var form = content
    .append('form')
    .html('<p>Note: all fields are required.</p>' +
          '<label>' +
          '  Email address:' +
          '  <input type="text" name="email" />' +
          '</label>' +
          '<br />' +

          '<label>' +
          '  Name:' +
          '  <input type="text" name="name" />' +
          '</label>' +
          '<br />' +

          '<label>' +
          '  State/Territory:' +
          '  <input type="text" name="state" />' +
          '</label>' +
          '<br />' +
          '<br />' +

          'Affiliations (select all that apply):' +
          '<br /><input type="checkbox" name="affil_self_advocate" value="on" /> Self Advocate' +
          '<br /><input type="checkbox" name="affil_family_member" value="on" /> Family Member/Representative' +
          '<br /><input type="checkbox" name="affil_health_provider" value="on" /> Health Provider or Professional' +
          '<br /><input type="checkbox" name="affil_education_provider" value="on" /> Education Provider or Professional' +
          '<br /><input type="checkbox" name="affil_smcha_staff" value="on" /> State Maternal Child Health Agency Staff' +
          '<br /><input type="checkbox" name="affil_local_org_staff" value="on" /> Community-Based or Local Organization Staff' +
          '<br />' +
          '<br />' +

          '<label>' +
          '  Reason for using the System Support Mapper:' +
          '  <br />' +
          '  <textarea name="reason" rows="5" cols="60"></textarea>' +
          '</label>' +
          '<br />' +

          '<label>' +
          '  Password:' +
          '  <input type="password" name="password" />' +
          '</label>' +
          '<br />' +

          '<label>' +
          '  Confirm password:' +
          '  <input type="password" name="password" />' +
          '</label>' +
          '<br />' +
          '<input type="submit" name="Login" />' +
          '<br />' +
          '<br />');

  // JST 2015-08-23 - Stop propagation of keydown events, so that the
  // handlers elsewhere in this code don't prevent default. I needed to do
  // this to allow users to hit 'backspace' in these fields.
  form.selectAll('input[type=text]')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });
  form.selectAll('textarea')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });
  form.selectAll('input[type=password]')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });

  var link = content
    .append('a')
    .attr('href', '#')
    .text('Already have an account? Login.')
    .on('click', function() {
      content.selectAll('*').remove();
      renderLoginForm(d3, callback);
    });
  var message = content
    .append('p')
    .attr('class', 'message');

  form.on('submit', function() {
    d3.event.preventDefault();
    var elements = d3.event.target.elements;
    if (elements.password[0].value !== elements.password[1].value) {
      d3.select('#authentication p.message')
        .text("Passwords don't match. Try again.");
    } else if (!elements.email.value) {
      d3.select('#authentication p.message')
        .text("Email is required. Try again.");
    } else if (!elements.name.value) {
      d3.select('#authentication p.message')
        .text("Name is required. Try again.");
    } else if (!elements.state.value) {
      d3.select('#authentication p.message')
        .text("State is required. Try again.");
    } else if (!elements.reason.value) {
      d3.select('#authentication p.message')
        .text("Reason is required. Try again.");
    } else if (!elements.password[0].value) {
      d3.select('#authentication p.message')
        .text("Password is required. Try again.");
    } else {

      d3.select('#authentication p.message').text('Loading...');
      var requestData = {
        email: elements.email.value,
        password: elements.password[0].value,
        name: elements.name.value,
        state: elements.state.value,
        reason: elements.reason.value
      };

      var affiliations = [
        'affil_self_advocate',
        'affil_family_member',
        'affil_health_provider',
        'affil_education_provider',
        'affil_smcha_staff',
        'affil_local_org_staff'
      ];

      for (var i=0; i<affiliations.length; i++) {
        if (elements[affiliations[i]].checked) {
          requestData[affiliations[i]] = 'on';
        }
      }

      d3.xhr(modBackend.backendBase + '/register')
        .header('Content-Type', 'application/json')
        .on('beforesend',
            function(request) { request.withCredentials = true; })
        .post(JSON.stringify(requestData), function(error, data) {
          if (error) {
            d3.select('#authentication p.message').text('Login failed');
          } else {
            d3.select('#authentication').style('visibility', 'hidden');
            d3.select('#authentication .content *').remove();
            callback();
          }
        });
    }
  });
};

// Render the login form and call the callback when the user is auth'd.
var renderLoginForm = function(d3, callback) {
  var content = d3.select('#authentication .content');
  content.selectAll('*').remove();
  content.append('h1')
    .text('Welcome to the System Support Mapper');
  content.append('p')
    .text('The System Support Mapper (SSM) is a tool that can help you visualize a network of support. For example, if you have a special needs child, SSM can help you understand what your needs are to support your child, how you address those needs, and where you might need more help.');
  content.append('p')
    .text("In order to save your work, you'll need to complete a free registration. If you've already registered, please log in below. Otherwise, click the link below to register.");

  var header = content
    .append('h1')
    .text('You must log in first:');
  var form = content
    .append('form')
    .attr("id", "login")
    .html('<label for="email_input">' +
          '  Email address:' +
          '</label>' +
          '  <input type="text" name="email" id="email_input" />' +
          '<br />' +
          '<label for="password_input">' +
          '  Password:' +
          '</label>' +
          '  <input type="password" name="password" id="password_input" />' +
          '<br />' +
          '<input type="submit" name="Log in" />' +
          '<br />' +
          '<br />');

  // JST 2015-08-23 - Stop propagation of keydown events, so that the
  // handlers elsewhere in this code don't prevent default. I needed to do
  // this to allow users to hit 'backspace' in these fields.
  form.selectAll('input[type=text]')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });
  form.selectAll('input[type=password]')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });

  var link = content
    .append('a')
    .attr('href', '#')
    .text("Don't have an account? Create one.")
    .on('click', function() {
      content.selectAll('*').remove();
      renderRegistrationForm(d3, callback);
    });
  var message = content
    .append('p')
    .attr('class', 'message');

  form.on('submit', function() {
    d3.event.preventDefault();
    d3.select('#authentication p.message').text('Loading...');
    var requestData = {
      email   : d3.event.target[0].value,
      password: d3.event.target[1].value
    };
    d3.xhr(modBackend.backendBase + '/login')
      .header('Content-Type', 'application/json')
      .on('beforesend', function(request) { request.withCredentials = true; })
      .post(JSON.stringify(requestData), function(error, data) {
        if (error) {
          d3.select('#authentication p.message').text('Login failed');
        } else {
          d3.select('#authentication').style('visibility', 'hidden');
          d3.select('#authentication .content *').remove();
          callback();
        }
      });
  });
};

// Prompt user for login/registration, then call the given function (with no
// arguments).
exports.afterAuthentication = function(d3, callback) {
  checkAuthentication(d3, function(isAuthenticated) {
    if (isAuthenticated) {
      callback();
    } else {
      d3.select('#authentication')
        .style('visibility', 'visible')
        .on('click', function() {
          d3.select('#authentication').style('visibility', 'hidden');
          d3.select('#authentication .content *').remove();
        });
      d3.select('#authentication .content')
        .on('click', function() {
          d3.event.stopPropagation();
        });
      renderLoginForm(d3, callback);
    }
  });
};

// Log the current user out.
exports.logoutUser = function(d3) {
  d3.xhr(modBackend.backendBase + '/logout')
    .on('beforesend', function(request) { request.withCredentials = true; })
    .get(function(error, data) {
      if (error) {
        console.log('Logout error:', error);
        alert('Error logging out.');
      } else {
        alert("You have logged out from SSM.");
        window.onbeforeunload = null;
        window.location.reload();
      }
    });
}

},{"./backend.js":3}],3:[function(require,module,exports){
exports.backendBase = 'http://syssci.renci.org:8080';

},{}],4:[function(require,module,exports){
exports.visible = false;
exports.center = null;
exports.hideText = 'Hide Circles of Care';

// Create three concentric circles.
exports.create = function(d3) {
  d3.select("#graphG").append("g")
    .attr("id", "circlesOfCareGroup")
    .classed("visible", exports.visible);
  d3.select("#circlesOfCareGroup").selectAll(".cOfC")
    .data([75, 200, 350])
    .enter().append("circle")
      .classed("cOfC", true)
      .style("fill", "none")
      .attr("r", function(d) {
        return d;
      });
};

exports.show = function(d3) {
  if (!exports.center) {
    exports.center = {
      "x": d3.select("#topGraphDiv").node().clientWidth / 2,
      "y": d3.select("#topGraphDiv").node().clientHeight / 2};
  }
  exports.visible = true;
  d3.select("#circlesOfCareGroup").classed("visible", exports.visible);
  d3.selectAll(".cOfC")
    .attr("cx", exports.center.x)
    .attr("cy", exports.center.y);
  d3.select("#cOfCItem").text(exports.hideText)
    .datum({"name": exports.hideText});
};

exports.hide = function(d3) {
  exports.center = null;
  exports.visible = false;
  d3.select("#circlesOfCareGroup").classed("visible", exports.visible);
  d3.select("#cOfCItem").text("Show Circles of Care")
    .datum({"name": "Show Circles of Care"});
};

},{}],5:[function(require,module,exports){
var animals = [
  'aardvark',
  'badger',
  'camel',
  'deer',
  'eagle',
  'fish',
  'gazelle',
  'hedgehog',
  'impala',
  'jaguar',
  'kangaroo',
  'leopard',
  'moose',
  'newt',
  'owl',
  'pig',
  'quail',
  'raccoon',
  'scorpion',
  'tiger',
  'urchin',
  'vulture',
  'walrus',
  'xerus',
  'yak',
  'zebra'
];

exports.completionsByType = {
  'role': animals,
  'responsibility': animals,
  'need': animals,
  'resource': animals
};

},{}],6:[function(require,module,exports){
var modEvents = require('./events.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelection = require('./selection.js'),
    modText = require('./text.js'),
    modUpdate = require('./update.js');

var contextText = null;

// Based on http://www.w3schools.com/ajax/tryit.asp?filename=tryajax_first
// Read a file from the server into contextText.
var loadContextTextFromServer = function(fileName) {
  var jsonObj = null;
  var xmlhttp;
  if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  }
  else { // code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      contextText = JSON.parse(xmlhttp.responseText);
    }
  };

  xmlhttp.open("GET",fileName, true);
  xmlhttp.send();
};

var createContextMenu = function(d3) {
  d3.select("#topGraphDiv").insert("div", ":first-child")
    .classed("menuHidden", true).classed("menu", false)
    .attr("id", "contextMenuDiv")
    .attr("position", "absolute")
    .on("mouseleave", function() {
      d3.select("#contextMenuDiv")
        .classed("menu", false).classed("menuHidden", true);
    });
  loadContextTextFromServer("defaultContextText.json");
};

// Returns false if no object (shape or edge) is selected. Otherwise populates
// the right-click context menu with items appropriate to the object selected,
// and returns true.
var populateContextMenu = function(d3) {
  var choices = null;
  var selectedElement = d3.select(".selected");

  if ((!selectedElement) || (!selectedElement.node())) {
    alert("You haven't selected an element. Click on a shape or an edge to select it");
    return false;
  }

  d3.selectAll("li.contextMenuListItem").remove();

  if (selectedElement.node().__data__.source) { // It's an edge
    choices = contextText.verbs;
  } else {
    switch(selectedElement.node().__data__.shape) {
      case "circle":
        choices = contextText.role;
        break;
      case "rectangle":
        choices = contextText.responsibilities;
        break;
      case "diamond":
        choices = contextText.needs;
        break;
      case "ellipse":
        choices = contextText.resources;
        break;
      case "star":
      case "noBorder":
        choices = contextText.wishes;
        break;
      default:
        alert("populateContextMenu(): unknown shape selected.");
        break;
    }
  }

  d3.select("#contextMenuDiv").append("ul").attr("id", "contextMenuList");
  d3.select("#contextMenuList").selectAll("li.contextMenuListItem")
    .data(choices).enter()
    .append("li")
      .classed("contextMenuListItem", true)
      .attr("id", function(d, i) { return "contextMenuListItem" + i; })
      .text(function(d) { return d; })
      .on("mouseover", function() {
      })
      .on("mouseout", function() {
      })
      .on("mouseup", function(d) {
        d3.select("#contextMenuDiv").classed("menu", false).classed("menuHidden", true);
        if (selectedElement.node()) {
          selectedElement.selectAll("text").remove();
          var data = selectedElement.node().__data__;
          data.name = d;
         // Force shape resize in case bold characters overflow shape boundaries:
          data.r = data.width = data.height = data.dim = data.rx = data.ry = data.innerRadius
                 = undefined;
          modText.formatText(d3, selectedElement, data);
          if (data.source) { // It's an edge
            selectedElement.select(".foregroundText")
                           .style("fill", modSelectedColor.color);
          }
          modUpdate.updateGraph(d3);
        } else {
          alert("contextMenuListItem.on(\"mouseup\"): no element selected.");
          return false;
        }
      });
  return true;
};

var showContextMenu = function(d3, e) {
  d3.select("#contextMenuDiv")
    .classed("menuHidden", false).classed("menu", true)
    .style("left", e.clientX + "px")
    .style("top", e.clientY + "px");
};

// User uploads new file from client into contextText.
exports.loadFromClient = function(d3) {
  document.getElementById("hidden-textFile-upload").click();
  d3.select("#hidden-textFile-upload").on("change", function() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var uploadFile = this.files[0];
      var filereader = new window.FileReader();
      var txtRes;

      filereader.onload = function() {
        try {
          txtRes = filereader.result;
        } catch(err) {
          window.alert("Error reading file: " + err.message);
        }
        // TODO better error handling
        try {
          contextText = JSON.parse(txtRes);
        } catch(err) {
          window.alert("Error parsing uploaded file\nerror message: " + err.message);
          return;
        }
      };
      filereader.readAsText(uploadFile);
    } else {
      alert("Your browser won't let you read this file -- try upgrading your browser to IE 10+ "
          + "or Chrome or Firefox.");
    }
  });
};

// http://stackoverflow.com/questions/4909167/how-to-add-a-custom-right-click-menu-to-a-webpage
exports.setup = function(d3) {
  createContextMenu(d3);
  if (document.addEventListener) {
    document.addEventListener("contextmenu", function(e) {
      if (e.which === modEvents.rightMouseBtn) {
        var elt = e.target || e.srcElement; // target for Firefox, srcElement for Chrome
        if (elt && (elt.tagName !== "svg")) { // Did we right-click on an object?
          while (elt && (elt.tagName !== "g")) { // elt is probably a child of the shapeG we want
            elt = elt.parentElement; // Assume there's a group in the hierarchy
          }
          if (elt) {
            var eltData = elt.__data__;
            var shapeGs = d3.selectAll(".shapeG");
            shapeGs.each(function(d) {
              if ((d.id === eltData.id) // Select the right-clicked-on shape group...
                && (!modSelection.selectedNode // ...if no shapeG is selected, or...
                || (modSelection.selectedNode.id !== d.id))) { // ...if d not already selected
                modSelection.selectNode(d3.select(this), eltData); // Expects shapeG as the first arg
              }
            });
        }
      }
      if (elt && elt.__data__ && !elt.__data__.manualResize && populateContextMenu(d3)) {
        showContextMenu(d3, e);
      }
      e.preventDefault();
    }
  }, false);
  } else {
    document.attachEvent("oncontextmenu", function() {
      alert("modContextMenu.setup(): oncontextmenu");
      window.event.returnValue = false;
    });
  }
};

},{"./events.js":12,"./selected-color.js":22,"./selection.js":24,"./text.js":28,"./update.js":31}],7:[function(require,module,exports){
var modAuth = require('./auth.js'),
    modBackend = require('./backend.js'),
    modCirclesOfCare = require('./circles-of-care.js'),
    modSerialize = require('./serialize.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modUtil = require('./util.js');

// Fetch a map from the backend given its id
var fetchMap = function(d3, id) {
  d3.json(modBackend.backendBase + '/map/' + id)
    .on('beforesend', function(request) { request.withCredentials = true; })
    .on('error',
        function() { window.alert('Error talking to backend server.'); })
    .on('load', function(data) {
      d3.select('#map-index').style('visibility', 'hidden');
      modSerialize.importMap(d3, data.document, id);
      window.location.hash = '/map/' + id;
    })
    .send('GET');
};

var defaultName = function(mapId) {
  return 'map #' + mapId;
};

var renameMap = function(d3, id, newName) {
  d3.xhr(modBackend.backendBase + '/map/' + id + '/rename')
    .header('Content-Type', 'application/json')
    .on('beforesend', function(request) { request.withCredentials = true; })
    .on('error', function(req) {
      var resp = req.response && JSON.parse(req.response);
      if (resp
          && resp.message == 'map not owned by authenticated user') {
        alert("Can't save: you have read-only access to this map.");
      } else {
        console.error('Failed to save map. Request was:', req);
        alert('Failed to save map #' + id);
      }
    })
    .on('load', function(data) {
      window.alert('Map renamed.');
      d3.select('#map-index').style('visibility', 'hidden');
    })
    .send('PUT', JSON.stringify({name: newName}));
};

// Delete a map from the backend given its id
var deleteMap = function(d3, id) {
  d3.xhr(modBackend.backendBase + '/map/' + id)
    .header('Content-Type', 'application/json')
    .on('beforesend', function(request) { request.withCredentials = true; })
    .on('error',
        function() { window.alert('Error talking to backend server.'); })
    .on('load', function(data) {
      window.alert('Map deleted.');
      d3.select('#map-index').style('visibility', 'hidden');
    })
    .send('DELETE');
};

var renderAdminRegisterUserForm = function(d3) {
  d3.selectAll('#admin-register-user .content *').remove();
  d3.select('#admin-register-user').style('visibility', 'visible');
  var content = d3.select('#admin-register-user .content');
  content.html(
    '<form>' +
    '  <label>Email address: <input type="text" placeholder="user@example.com" /></label><br/>' +
    '  <label>Password: <input type="password" /></label><br/>' +
    '  <input type="submit" />' +
    '</form>'
  );
  content.selectAll('input')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });
  var emailInput = content.select('input[type=text]'),
      passwordInput = content.select('input[type=password]'),
      submitButton = content.select('input[type=submit]');

  submitButton.on('click', function() {
    var confirmText = 'Are you sure you want to create a new user? ' +
          '(This action cannot be undone.) ' +
          'Note that you must remember the password, ' +
          'because you must email it to them afterwards.';
    if (window.confirm(confirmText)) {
      var requestObject = {email: emailInput.property('value'),
                           password: passwordInput.property('value')};
      d3.xhr(modBackend.backendBase + '/register')
        .header('Content-Type', 'application/json')
        .on('beforesend', function(request) {request.withCredentials = true;})
        .on('error', function(req) {
          console.error('Failed to create new user. Request was:', req);
          alert('Failed to create new user.');
        })
        .on('load', function(request) {
          alert('Created new user. You must email them to inform them of their password.');
        })
        .send('POST', JSON.stringify(requestObject));}
  });

  d3.select('#admin-register-user')
    .style('visibility', 'visible')
    .on('click', function() {
      d3.select('#admin-register-user .loading-message').remove();
      d3.select('#admin-register-user').style('visibility', 'hidden');
      d3.select('#admin-register-user table').remove();
    });
  content
    .on('click', function() {
      d3.event.stopPropagation();
    });
};

var renderMapsList = function(d3, data) {
  d3.selectAll('#map-index .content *').remove();
  var asAdmin = data && data[0] && data[0].hasOwnProperty('owner_email');
  var userId = modUtil.readCookieByName('user_id');

  if (asAdmin) {
    d3.select('#map-index .content')
      .append('p')
      .append('a')
      .attr('href', '#')
      .text('Register a new user')
      .on('click', function() {
        d3.select('#map-index').style('visibility', 'hidden');
        renderAdminRegisterUserForm(d3);
      });
  }

  var columns =
    ['Map ID', 'Name', 'Created At', 'Modified At', 'Num. Nodes', 'Num. Links'];
  if (asAdmin) {
    columns.push('Owner Email');
  }
  columns.push('Rename');
  columns.push('Delete');

  if (!data || data.length === 0) {
    d3.select('#map-index .content').append('p')
      .text("You're logged in, but you don't have any maps yet. " +
            "To get started, create a map and click the 'save' button.");
    return;
  }

  var table = d3.select('#map-index .content').append('table'),
      thead = table.append('thead'),
      tbody = table.append('tbody');

  thead
    .append('tr')
    .selectAll('th')
    .data(columns)
    .enter()
    .append('th')
    .text(String);

  var rows = tbody
    .selectAll('tr')
    .data(data)
    .enter()
    .append('tr');

  rows.append('td')
    .append('a')
    .attr('href', '#')
    .on('click', function(d) { fetchMap(d3, d.id); })
    .text(function(d) { return d.id; });
  rows.append('td')
    .append('a')
    .attr('href', '#')
    .on('click', function(d) { fetchMap(d3, d.id); })
    .text(function(d) { return d.name; });
  rows.append('td').text(function(d) { return d.created_at; });
  rows.append('td').text(function(d) { return d.modified_at; });
  rows.append('td').text(function(d) { return d.num_nodes; });
  rows.append('td').text(function(d) { return d.num_links; });
  if (asAdmin) {
    rows.append('td').text(function(d) { return d.owner_email; });
  }

  rows.append('td')
    .append('a')
    .attr('href', '#')
    .on('click', function(d) {
      if (userId == d.owner) {
        var promptText = 'Please enter the name for map #' + d.id;
        var defaultText = d.name || defaultName(d.id);
        var newName = prompt(promptText, defaultText);
        if (newName != null) {
          renameMap(d3, d.id, newName);
        }
      } else {
        alert("You cannot rename a map that you don't own, even if you're an admin. Sorry about that.");
      }
    })
    .text(function(d) {
      if (userId == d.owner) {
        return 'rename';
      } else {
        return '';
      }
    });

  rows.append('td')
    .append('a')
    .attr('href', '#')
    .on('click', function(d) {
      if (userId == d.owner) {
        if (window.confirm("Press OK to delete this graph from the server.")) {
          deleteMap(d3, d.id);
        }
      } else {
        alert("You cannot delete a map that you don't own, even if you're an admin. Sorry about that.");
      }
    })
    .text(function(d) {
      if (userId == d.owner) {
        return 'X';
      } else {
        return '';
      }
    });
};

var listMaps = function(d3) {
  d3.select('#map-index .content')
    .append('div')
    .attr('class', 'loading-message')
    .text('Loading...');
  d3.select('#map-index')
    .style('visibility', 'visible')
    .on('click', function() {
      d3.select('#map-index .loading-message').remove();
      d3.select('#map-index').style('visibility', 'hidden');
      d3.select('#map-index table').remove();
    });
  d3.select('#map-index .content')
    .on('click', function() {
      d3.event.stopPropagation();
    });
  d3.json(modBackend.backendBase + '/maps')
    .on('beforesend', function(request) { request.withCredentials = true; })
    .on('error',
        function(error) { window.alert('Error talking to backend server.'); })
    .on('load', function(result) { renderMapsList(d3, result); })
    .send('GET');
};

exports.setupReadMapFromDatabase = function(d3) {
  d3.select("#read-from-db")
    .on("click",
        function() {
          modAuth.afterAuthentication(d3, function() {
            listMaps(d3);
          });
        });
};

// Look in the location's 'hash' property (i.e. everything after the '#') for
// a map ID. If the hash property is of the form '/map/<id>', where '<id>' is
// an integer, try to load the map from the server. Return whether we tried to
// load a map.
exports.loadMapFromLocation = function(d3) {
  var m  = window.location.hash.match(/\/map\/(\d+)/);
  if (m) {
    var id = m[1];
    d3.json(modBackend.backendBase + '/map/' + id)
      .on('beforesend', function(request) { request.withCredentials = true; })
      .on('error',
          function(error) {
            var resp = JSON.parse(error.response);
            if (resp.message && resp.message == 'not authenticated') {
              modAuth.afterAuthentication(d3, function() {
                exports.loadMapFromLocation();
              });
            } else if (resp.message
                && resp.message == 'map not owned by authenticated user') {
              alert("You don't have access to map # " + id + '. ' +
                    'Redirecting to a blank map.');
              window.location.hash = '';
            } else {
              console.error(error);
              alert('Error talking to backend server.');
            }
          })
      .on('load', function(data) {
        modSerialize.importMap(d3, data.document, id);
        window.location.hash = '/map/' + id;
      })
      .send('GET');
  }
  return !!m;
};

exports.writeMapToDatabase = function(d3, skipSuccessAlert) {
  modAuth.afterAuthentication(d3, function() {
    var m  = window.location.hash.match(/\/map\/(\d+)/);
    if (m) {
      // update existing map
      var id = m[1];
      d3.xhr(modBackend.backendBase + '/map/' + id)
        .header('Content-Type', 'application/json')
        .on('beforesend', function(request) {
          request.withCredentials = true;
        })
        .on('error', function(req) {
          var resp = req.response && JSON.parse(req.response);
          if (resp
              && resp.message == 'map not owned by authenticated user') {
            alert("Can't save: you have read-only access to this map.");
          } else {
            console.error('Failed to save map. Request was:', req);
            alert('Failed to save map # ' + id);
          }
        })
        .on('load', function(data) {
          if (!skipSuccessAlert) {
            alert('Saved map #' + id + '.');
          }
        })
        .send('PUT', JSON.stringify(modSerialize.getMapObject(d3)));

    } else {
      // create new map
      d3.xhr(modBackend.backendBase + '/map')
        .header('Content-Type', 'application/json')
        .on('beforesend', function(request) {
          request.withCredentials = true;
        })
        .on('error', function(req) {
          console.error('Failed to save new map. Request was:', req);
          alert('Failed to save new map ');
        })
        .on('load', function(request) {
          var data = JSON.parse(request.response);
          if (!skipSuccessAlert) {
            var text = 'Saved new map #' + data.id + ' with default name. ' +
                  'To change the name, click the "Read map from database" ' +
                  'button in the toolbox, then click "Rename".';
            alert(text);
          }
          window.location.hash = '/map/' + data.id;
        })
        .send('POST', JSON.stringify(modSerialize.getMapObject(d3)));
    }
  });
};

exports.setupWriteMapToDatabase = function(d3) {
  d3.select("#write-to-db").on("click", function() {
    exports.writeMapToDatabase(d3);
  });
};

},{"./auth.js":2,"./backend.js":3,"./circles-of-care.js":4,"./serialize.js":25,"./system-support-map.js":27,"./util.js":32}],8:[function(require,module,exports){
var modGrid = require('./grid.js'),
    modSvg = require('./svg.js'),
    modUpdate = require('./update.js');

exports.justDragged = false;
exports.shiftNodeDrag = false;
exports.clickDragHandle = false;
exports.dragLine = null;
exports.drag = null;
exports.dragHandle = null;

var dragmove = function(d3, d) {
  if (exports.shiftNodeDrag) { // Creating a new edge
    exports.dragLine.attr("d", "M" + d.x + "," + d.y + "L" + d3.mouse(modSvg.svgG.node())[0]
                       + "," + d3.mouse(modSvg.svgG.node())[1]);
  } else { // Translating a shape
    exports.dragLine.style("stroke-width", 0);
    d.x += d3.event.dx;
    d.y +=  d3.event.dy;
    modGrid.snap(d);
    modUpdate.updateGraph(d3);
  }
};

exports.setupDrag = function(d3) {
  exports.dragLine = modSvg.svgG.append("svg:path") // Displayed when dragging between nodes
    .attr("class", "link dragline hidden")
    .attr("d", function() { return "M0,0L0,0"; })
    .style("marker-end", "url(#mark-end-arrow)");

  exports.drag = d3.behavior.drag()
    .origin(function(d) {
      return {x: d.x, y: d.y};
    })
    .on("drag", function(args) {
      exports.justDragged = true;
      dragmove(d3, args);
    })
    .on("dragend", function(args) {
      modGrid.snap(args);
      // Todo check if edge-mode is selected
    });
};

// Handle goes in the lower right-hand corner of a rectangle: shift-drag to
// resize rectangle.
exports.setupDragHandle = function(d3) {
  exports.dragHandle = d3.behavior.drag()
    .on("dragstart", function(d) {
      if (!d3.event.sourceEvent.shiftKey) { return; }
      d.manualResize = true;
      d.name = "";
      d3.select(this).style("opacity", 1);
      if (!d.xOffset) {
        d.xOffset = d.width / 2;
        d.yOffset = d.height / 2;
      }
      d3.event.sourceEvent.stopPropagation();
    })
    .on("drag", function(d) {
      var x = d3.event.x;
      var y = d3.event.y;
      d3.select(this)
        .attr("transform", function() {
        return "translate(" + x + "," + y + ")";
      });
      d3.select("#shape" + d.id)
        .attr("width", Math.abs(x + d.xOffset))
        .attr("height", Math.abs(y + d.yOffset));
    })
    .on("dragend", function(d) {
      var rectangle = d3.select("#shape" + d.id);
      d.width = parseFloat(rectangle.attr("width"));
      d.height = parseFloat(rectangle.attr("height"));
      d3.select(this).style("opacity", 0);
      var currG = d3.select("#shapeG" + d.id);
      currG.select("text").text("");

      // Move the resized rect group to higher in the DOM so edges and other shapes are on top:
      var remove = currG.remove();
      d3.select("#manResizeGG").append(function() {
        return remove.node();
      });
    });
};

},{"./grid.js":18,"./svg.js":26,"./update.js":31}],9:[function(require,module,exports){
var modEdgeThickness = require('./edge-thickness.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelectedShape = require('./selected-shape.js');

exports.style = 'solid';

var esDashedEdgeRectY = 15;  // "es" -> edge selection

// Incorporate rects so you don't have to click right on the edge to select it.
var addSelectionRects = function(d3) {
  d3.select("#edgeStyleSelectionSvg").selectAll(".edgeStyleRect")
    .data([{"id": "solidEdgeRect", "y": 0},
           {"id": "dashedEdgeRect", "y": esDashedEdgeRectY}])
    .enter().append("rect")
    .attr("id", function (d) { return d.id; })
    .classed("edgeStyleRect", true)
    .style("opacity", 0.2)
    .attr("x", 0)
    .attr("y", function(d) { return d.y; })
    .attr("width", modSelectedShape.sssw)
    .attr("height", "15px");
};

var setupSelectionMarkers = function(d3) {
  d3.select("#edgeStyleSelectionSvg").selectAll("marker")
    .data([{"id": "selectedEdgeArrowHead", "color": modSelectedColor.clr},
           {"id": "unselectedEdgeArrowHead", "color": modSelectedColor.unselected}])
    .enter().append("marker")
      .attr("id", function(d) { return d.id; })
      .attr("viewBox", "0 -5 10 10")
      .attr("markerWidth", 3.75)
      .attr("markerHeight", 3.75)
      .attr("orient", "auto")
      .attr("fill", function(d) { return d.color; })
      .attr("stroke", function(d) { return d.color; })
      .append("svg:path")
        .style("stroke-linejoin", "miter")
        .attr("d", "M0,-5L10,0L0,5");
  d3.select("#selectedEdgeArrowHead")
    .on("click", function() {
      selectEdgeStyle(d3, modSelectedColor.clr, "#solidEdgeSelection", "#dashedEdgeSelection");
    });
  d3.select("#unselectedEdgeArrowHead")
    .on("click", function() {
      selectEdgeStyle(d3, modSelectedColor.clr, "#dashedEdgeSelection", "#solidEdgeSelection");
    });
};

var createEdgeStyleSelectionSampleEdges = function(d3) {
  d3.select("#edgeStyleSelectionSvg").selectAll(".styleSelectionLine")
    .data([{"id": "solid", "marker": "#", "stroke": "#000000", "y": "7.5", "other": "dashed",
            "dasharray": "none"},
           {"id": "dashed", "marker": "#un", "stroke": modSelectedColor.unselected,
            "y": "23.5", "other": "solid", "dasharray": "10, 2"}])
    .enter().append("line")
      .classed("styleSelectionLine", true)
      .attr("id", function(d) { return d.id + "EdgeSelection"; })
      .style("marker-end", function(d) { return "url(" + d.marker + "#selectedEdgeArrowHead"; })
      .style("stroke", function(d) { return d.stroke; })
      .style("stroke-width", modEdgeThickness.thickness)
      .style("stroke-dasharray", function(d) { return d.dasharray; })
      .attr("x1", modSelectedShape.esEdgeX1)
      .attr("y1", function(d) { return d.y; })
      .attr("x2", 4 * modSelectedShape.sssw / 5)
      .attr("y2", function(d) { return d.y; })
      .on("click", function(d) {
        selectEdgeStyle(d3, modSelectedColor.clr,
                        "#" + d.id + "EdgeSelection",
                        "#" + d.other + "EdgeSelection");
      });

  // Hack to make sure the edge selection arrowheads show up in Chrome and IE:
  selectEdgeStyle(d3, modSelectedColor.clr, "#solidEdgeSelection", "#dashedEdgeSelection");

  var onMouseOverEdgeStyle = function(selectionId) {
    d3.select(selectionId)
      .attr("opacity", 1)
      .attr("cursor", "pointer")
      .attr("stroke", "#000000");
  };
  d3.select("#solidEdgeRect")
    .on("mouseover", function() { onMouseOverEdgeStyle("#solidEdgeSelection"); })
    .on("click", function() {
      selectEdgeStyle(d3, modSelectedColor.clr, "#solidEdgeSelection", "#dashedEdgeSelection");
    });
  d3.select("#dashedEdgeRect")
    .on("mouseover", function() { onMouseOverEdgeStyle("#dashedEdgeSelection"); })
    .on("click", function() {
      selectEdgeStyle(d3, modSelectedColor.clr, "#dashedEdgeSelection", "#solidEdgeSelection");
    });
};

// Solid or dashed edge?
var selectEdgeStyle = function(d3, clr, selectedId, deselectedId) {
  d3.select(selectedId)
    .style("marker-end", function() {
      return "url(#end-arrow" + clr.substr(1) + ")";
    })
    .style("stroke", modSelectedColor.clr)
    .classed("sel", true)
    .classed("unsel", false);
  d3.select(deselectedId)
    .style("marker-end", "url(#unselectedEdgeArrowHead)")
    .style("stroke", modSelectedColor.unselected)
    .classed("unsel", true)
    .classed("sel", false);
  exports.style = (selectedId === "#solidEdgeSelection") ? "solid" : "dashed";
};

// User selects solid or dashed line and line color.
exports.addControls = function(d3) {
  d3.select("#toolbox").insert("div", ":first-child")
    .attr("id", "edgeStyleSelectionDiv");
  d3.select("#edgeStyleSelectionDiv").append("svg")
    .attr("id", "edgeStyleSelectionSvg")
    .attr("width", "93px")
    .attr("height", "30px")
    .attr({"xmlns": "http://www.w3.org/2000/svg",
           "xmlns:xlink": "http://www.w3.org/1999/xlink",
           version: "1.1"
          });
  addSelectionRects(d3);
  setupSelectionMarkers(d3);
  createEdgeStyleSelectionSampleEdges(d3);
};

},{"./edge-thickness.js":10,"./selected-color.js":22,"./selected-shape.js":23}],10:[function(require,module,exports){
var modSelectedColor = require('./selected-color.js');

exports.thickness = 3;

exports.createSubmenu = function(d3) {
  d3.select("#setLineThicknessItem").append("div")
    .classed("menuHidden", true).classed("menu", false)
    .attr("id", "edgeThicknessSubmenuDiv")
    .attr("position", "absolute")
    .style("width", "90px")
    .on("mouseleave", function() {
      d3.select("#edgeThicknessSubmenuDiv").classed("menu", false).classed("menuHidden", true);
    })
    .on("mouseup", function() {
      d3.select("#edgeThicknessSubmenuDiv").classed("menu", false).classed("menuHidden", true);
    });
  var choices = [1, 2, 3, 4, 5, 6, 7];
  d3.select("#edgeThicknessSubmenuDiv").append("ul").attr("id", "edgeThicknessSubmenuList");
  d3.select("#edgeThicknessSubmenuList").selectAll("li.edgeThicknessSubmenuListItem")
    .data(choices).enter()
    .append("li")
      .classed("edgeThicknessSubmenuListItem", true)
      .attr("id", function(d, i) { return "edgeThicknessOption" + i; })
      .text(function(d) { return d + " pixel" + (d > 1 ? "s" : ""); })
      .style("text-shadow", function() {
        return (parseInt(d3.select(this).datum(), 10) === exports.thickness)
          ? "1px 1px #000000" : "none"; })
      .style("color", function() {
        return (parseInt(d3.select(this).datum(), 10) === exports.thickness)
          ? modSelectedColor.color : modSelectedColor.unselected;
      })
      .on("mouseup", function() {
        d3.select("#edgeThicknessSubmenuDiv").classed("menu", false).classed("menuHidden", true);
        d3.select("#optionsMenuDiv")
          .classed("menu", false).classed("menuHidden", true);
        exports.thickness = parseInt(d3.select(this).datum(), 10);
        d3.selectAll(".edgeThicknessSubmenuListItem")
          .style("color", modSelectedColor.unselected)
          .style("text-shadow", "none");
        d3.select(this)
          .style("color", modSelectedColor.color)
          .style("text-shadow", "1px 1px #000000");
      });
};

},{"./selected-color.js":22}],11:[function(require,module,exports){
var datalistId = function(selector) {
  // FIXME: this assumes the selector is an id selector, like '#selector'. It
  // doesn't have to be.
  return selector.slice(1) + '_datalist';
};

var onClickAdd = function(d3, selector, data,
                          uponAdd, uponUpdate, uponRemove, root) {
  return function(d,i){
    // + 1 for base-1 counting in `nth-child` selectors, and +1 for the
    // `<datalist>` element, which is an earlier sibling in the document.
    var inputSelector = 'span.entry:nth-child(' + (i+2) + ') input',
        newText = root.select(inputSelector).property('value'),
        newData = data.slice(0);
    if (newText !== '') {
      newData.push(newText);
      uponAdd(i, newText);
      update(d3, selector, newData, uponAdd, uponUpdate, uponRemove);
    }
  };
};

var onClickUpdate = function(d3, selector, data,
                             uponAdd, uponUpdate, uponRemove, root) {
  return function(d,i){
    var inputSelector = 'span.entry:nth-child(' + (i+2) + ') input',
        newText = root.select(inputSelector).property('value'),
        newData = data.slice(0);
    if (newText !== '') {
      newData[i] = newText;
      uponUpdate(i, newText);
      update(d3, selector, newData, uponAdd, uponUpdate, uponRemove);
    }
  };
};

var onClickRemove = function(d3, selector, data,
                             uponAdd, uponUpdate, uponRemove, root) {
  return function(d,i){
    var inputSelector = 'span.entry:nth-child(' + (i+2) + ') input',
        newText = root.select(inputSelector).property('value'),
        removed = data.slice(0,i).concat(data.slice(i+1, data.length)),
        newData = uponRemove(i) ? removed : data;
    d3.select(this.parentElement).remove();
    update(d3, selector, newData, uponAdd, uponUpdate, uponRemove);
  };
};

// This is based on the "general update pattern" in d3.
// For more info, see: http://bl.ocks.org/mbostock/3808234
var update = function(d3, selector, data, uponAdd, uponUpdate, uponRemove) {
  // Remove any empty entries with an "Add" button, to ensure that the final
  // "add" input is always in the "enter" selection.
  d3.select(selector).selectAll('span.entry button.add').each(function(d,i){
    var parentSel = d3.select(this.parentElement);
    if (parentSel.select('input').property('value') === '') {
      parentSel.remove();
    }
  });

  var root = d3.select(selector).selectAll('span.entry').data(data.concat("")),
      args = [d3, selector, data, uponAdd, uponUpdate, uponRemove, root];

  // These commands are only for the "update" selection, i.e. pre-existing
  // 'span.entry' elements.
  root.selectAll('button').remove();
  root.append('button').attr('class', 'update').text('Update');
  root.append('button').attr('class', 'remove').text('Remove');
  root.select('input').on('keyup', function(d,i){
    var key = d3.event.key || d3.event.keyIdentifier;
    d3.event.stopPropagation();
    if (key === 'Enter') {
      onClickUpdate.apply(null, args).call(null, d, i);
    }
  });

  // The `enter()` starts modifying the "enter" selection, i.e. data elements
  // for which there are no corresponding document elements.
  var newSpans = root.enter().append('span').attr('class', 'entry');
  newSpans.append('input')
    .attr('type', 'text')
    .attr('list', datalistId(selector))
    .on('keyup', function(d,i){
      var key = d3.event.key || d3.event.keyIdentifier;
      d3.event.stopPropagation();
      if (key === 'Enter') {
        onClickAdd.apply(null, args).call(null, d, i);
      }
    });
  newSpans.append('button').attr('class', 'add').text('Add');
  newSpans.select('input').node().focus();

  // Now edit both enter and update selections together.
  root.select('input').property('value', function(d){ return d; });
  root.select('button.add')   .on('click', onClickAdd   .apply(null, args));
  root.select('button.update').on('click', onClickUpdate.apply(null, args));
  root.select('button.remove').on('click', onClickRemove.apply(null, args));
  root.selectAll('br').remove();
  root.append('br');

  // Finally, remove any document elements that no longer have a corresponding
  // data element:
  root.exit().remove();
};

exports.setup = function(d3, selector, existingTexts, completions,
                         uponAdd, uponUpdate, uponRemove) {
  // Be sure to add the datalist as the first child element, for the sake of the
  // `nth-child` selections above.
  d3.select(selector)
    .append('datalist')
    .attr('id', datalistId(selector))
    .selectAll('option')
    .data(completions)
    .enter().append('option')
    .attr('value', String);
  var data = existingTexts.slice(0),
      root = d3.select(selector).selectAll('span.entry').data(data),
      newSpans = root.enter().append('span').attr('class', 'entry');
  newSpans.append('input').attr('type', 'text');
  update(d3, selector, data, uponAdd, uponUpdate, uponRemove);
};

exports.teardown = function(d3, selector) {
  d3.select(selector).selectAll('span.entry').remove();
  d3.select('#' + datalistId(selector)).remove();
};

},{}],12:[function(require,module,exports){
var modDrag = require('./drag.js'),
    modEdgeStyle = require('./edge-style.js'),
    modEdgeThickness = require('./edge-thickness.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelectedShape = require('./selected-shape.js'),
    modSelection = require('./selection.js'),
    modSvg = require('./svg.js'),
    modText = require('./text.js'),
    modUpdate = require('./update.js'),
    modZoom = require('./zoom.js');

exports.connectClass = 'connect-node';
exports.lastKeyDown = -1;
exports.mouseDownNode = null;
exports.mouseDownLink = null;
exports.shapeId = 0;
exports.rightMouseBtn = 3;

var BACKSPACE_KEY = 8,
    DELETE_KEY = 46,
    graphMouseDown = false,
    defaultShapeText = {"circle":    "Identity",
                        "rectangle": "Responsibility",
                        "diamond":   "Need",
                        "ellipse":   "Resource",
                        "star":      "Wish",
                        "noBorder":  "text"},
    // shapeNum values are 1-based because they're used in front-facing text:
    shapeNum = {"circle": 1,
                "rectangle": 1,
                "diamond": 1,
                "ellipse": 1,
                "star": 1,
                "noBorder": 1};

var currentEdgeStyle = function(source, target) {
  return {
    source: source,
    target: target,
    style: modEdgeStyle.style,
    color: modSelectedColor.clr,
    thickness: modEdgeThickness.thickness,
    name: ""
  };
};

// Remove links associated with a node
var spliceLinksForNode = function(node) {
  var toSplice = modSvg.links.filter(function(l) {
        return (l.source === node || l.target === node);
      });
  toSplice.map(function(l) {
    modSvg.links.splice(modSvg.links.indexOf(l), 1);
  });
};

// Keydown on main svg
var svgKeyDown = function(d3) {
  // Make sure repeated key presses don't register for each keydown
  if (exports.lastKeyDown !== -1) { return; }

  exports.lastKeyDown = d3.event.keyCode;
  var selectedNode = modSelection.selectedNode,
      selectedEdge = modSelection.selectedEdge;

  switch (d3.event.keyCode) {
  case BACKSPACE_KEY:
  case DELETE_KEY:
    d3.event.preventDefault();
    if (selectedNode) {
      modSvg.nodes.splice(modSvg.nodes.indexOf(selectedNode), 1);
      spliceLinksForNode(selectedNode);
      modSelection.selectedNode = null;
      modUpdate.updateGraph(d3);
    } else if (selectedEdge) {
      modSvg.links.splice(modSvg.links.indexOf(selectedEdge), 1);
      modSelection.selectedEdge = null;
      modUpdate.updateGraph(d3);
    }
    break;
  }
};

var svgKeyUp = function() {
  exports.lastKeyDown = -1;
};

// Mousedown on main svg
var svgMouseDown = function() {
  graphMouseDown = true;
};

// Mouseup on main svg
var svgMouseUp = function(d3) {
  // Make sure options menu is closed:
  d3.select("#optionsMenuDiv") .classed("menu", false).classed("menuHidden", true);

  if (modZoom.justScaleTransGraph) { // Dragged not clicked
    modZoom.justScaleTransGraph = false;
  } else if (graphMouseDown && d3.event.shiftKey) { // Clicked not dragged from svg
    var xycoords = d3.mouse(modSvg.svgG.node()),
        text = defaultShapeText[modSelectedShape.shape] + " " +
               shapeNum[modSelectedShape.shape]++,
        d = exports.addNode(d3, xycoords[0], xycoords[1], text),
        d3element = modSvg.shapeGroups.filter(function(dval) {
          return dval.id === d.id;
        });

    // Make text immediately editable
    var d3txt = modText.changeElementText(d3, d3element, d),
        txtNode = d3txt.node();
    modText.selectText(txtNode);
    txtNode.focus();
  } else if (modDrag.shiftNodeDrag) { // Dragged from node
    modDrag.shiftNodeDrag = false;
    modDrag.dragLine.classed("hidden", true).style("stroke-width", 0);
  } else if (graphMouseDown) { // Left-click on background deselects currently selected
    if (modSelection.selectedNode) {
      modSelection.removeSelectFromNode();
    } else if (modSelection.selectedEdge) {
      modSelection.removeSelectFromEdge();
    }
  }
  graphMouseDown = false;
};

// FIXME: this function and the next one should really live elsewhere, modSvg
// probably.

exports.addNode = function(d3, x, y, text) {
  var d = {id: exports.shapeId,
           name: text,
           x: x,
           y: y,
           color: modSelectedColor.clr,
           shape: modSelectedShape.shape};
  modSvg.nodes.push(d);
  exports.shapeId++;
  modUpdate.updateGraph(d3);
  return d;
};

exports.addEdge = function(d3, newEdge) {
  var filtRes = modSvg.edgeGroups.filter(function(d) {
    if (d.source === newEdge.target && d.target === newEdge.source) {
      modSvg.links.splice(modSvg.links.indexOf(d), 1);
    }
    return d.source === newEdge.source && d.target === newEdge.target;
  });
  if (!filtRes[0].length) {
    modSvg.links.push(newEdge);
    modUpdate.updateGraph(d3);
    // Todo: finish adapting the following code block for edges for immediate text edit on create.
    /*
     var d3txt = modText.changeElementText(d3, modSvg.links.filter(function(dval) {
     return dval.name === newEdge.name;
     }), newEdge);
     var txtNode = d3txt.node();
     modText.selectText(txtNode);
     txtNode.focus();
     */
  }
};

exports.removeEdge = function(source, target) {
  modSvg.links.filter(function(l){
    return l.source === source && l.target === target;
  }).map(function(l){
    modSvg.links.splice(modSvg.links.indexOf(l), 1);
  });
};

exports.setupEventListeners = function(d3) {
  var svg = modSvg.svg;
  d3.select(window).on("keydown", function() {
    svgKeyDown(d3);
  })
    .on("keyup", function() {
      svgKeyUp();
    });
  svg.on("mousedown", function() {
    svgMouseDown();
  });
  svg.on("mouseup", function(){
    svgMouseUp(d3);
  });
  window.onresize = function() {modUpdate.updateWindow(d3);};
};

// Mousedown on node
exports.shapeMouseDown = function(d3, d) {
  d3.event.stopPropagation();
  exports.mouseDownNode = d;
  if (d3.event.shiftKey && !d.manualResize) { // No edges from manually resized rectangles
    modDrag.shiftNodeDrag = d3.event.shiftKey;
    modDrag.dragLine.classed("hidden", false) // Reposition dragged directed edge
      .style("stroke-width", modEdgeThickness.thickness)
      .attr("d", "M" + d.x + "," + d.y + "L" + d.x + "," + d.y);
  }
};

// Mouseup on nodes
exports.shapeMouseUp = function(d3, d3node, d) {
  // Reset the states
  modDrag.shiftNodeDrag = false;
  modDrag.justDragged = false;
  d3node.classed(exports.connectClass, false);

  var mouseDownNode = exports.mouseDownNode;

  if (!mouseDownNode) { return; }

  modDrag.dragLine.classed("hidden", true).style("stroke-width", 0);

  if (!mouseDownNode.manualResize // We didn't start on a manually resized rectangle...
    && mouseDownNode !== d) { // ...& we're in a different node: create new edge and add to graph
    exports.addEdge(d3, currentEdgeStyle(exports.mouseDownNode, d));
  } else { // We're in the same node or the dragged edge started on a manually resized rectangle
    if (modDrag.justDragged) { // Dragged, not clicked
      modDrag.justDragged = false;
    } else { // Clicked, not dragged
      if (d3.event.shiftKey // Shift-clicked node: edit text content...
          && !d.manualResize) { // ...that is, if not manually resizing rect
        var d3txt = modText.changeElementText(d3, d3node, d);
        var txtNode = d3txt.node();
        modText.selectText(txtNode);
        txtNode.focus();
      } else if (d3.event.which !== exports.rightMouseBtn) { // left- or mid-clicked
        modSelection.selectNode(d3node, d);
      }
    }
  }
  exports.mouseDownNode = null;
};

exports.pathMouseDown = function(d3, d3path, d) {
  d3.event.stopPropagation();
  exports.mouseDownLink = d;

  if (modSelection.selectedNode) {
    modSelection.removeSelectFromNode();
  }

  var prevEdge = modSelection.selectedEdge;
  if (!prevEdge || prevEdge !== d) {
    modSelection.replaceSelectEdge(d3, d3path, d);
  } else if (d3.event.which !== exports.rightMouseBtn) {
    modSelection.removeSelectFromEdge();
  }
};

},{"./drag.js":8,"./edge-style.js":9,"./edge-thickness.js":10,"./selected-color.js":22,"./selected-shape.js":23,"./selection.js":24,"./svg.js":26,"./text.js":28,"./update.js":31,"./zoom.js":34}],13:[function(require,module,exports){
var modCirclesOfCare = require('./circles-of-care.js'),
    modSelectedColor = require('./selected-color.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modText = require('./text.js'),
    modUpdate = require('./update.js');

// Return dimensions of bounding box for all visible objects plus a little
// extra. Ignore toolbox.
var getGraphExtent = function(d3, shapes) {
  var minX = Number.MAX_VALUE;
  var maxX = Number.MIN_VALUE;
  var minY = Number.MAX_VALUE;
  var maxY = Number.MIN_VALUE;
  shapes.each(function(d) {
    if (d3.select(this).style("display") !== "none") { // Don't include hidden objects
      var bbox = this.getBBox();
      var x = d.x || parseFloat(d3.select(this).attr("cx")); // ssmCircles: no x, y
      var y = d.y || parseFloat(d3.select(this).attr("cy"));
      var thisXMin = x - bbox.width / 2;
      var thisXMax = x + bbox.width / 2;
      var thisYMin = y - bbox.height / 2;
      var thisYMax = y + bbox.height / 2;
      minX = (minX < thisXMin) ? minX : thisXMin;
      maxX = (maxX > thisXMax) ? maxX : thisXMax;
      minY = (minY < thisYMin) ? minY : thisYMin;
      maxY = (maxY > thisYMax) ? maxY : thisYMax;
    }
  });
  var width = maxX - minX;
  var height = maxY - minY;
  var xCushion = 40, yCushion = 100;
  return {"w": width + xCushion, "h": height + yCushion};
};

// Based on http://techslides.com/save-svg-as-an-image
exports.exportGraphAsImage = function(d3) {
  var shapes = d3.selectAll(".ssmGroup circle, g.shapeG .shape, .cOfC");

  // Set attributes of objects to render correctly without css:
  shapes.style("fill", "#F6FBFF");
  d3.select("#circlesOfCareGroup")
    .attr("display", modCirclesOfCare.visible ? "inline-block" : "none");
  d3.selectAll(".cOfC")
    .style("fill", "none")
    .style("stroke-width", "1px")
    .style("stroke", "#000000");
  d3.selectAll(".ssmCircle")
    .style("fill", "none")
    .style("display", (modSystemSupportMap.visible ? "inline-block" : "none"));
  d3.selectAll(".ssmHidden").attr("display", "none");
  d3.select("#gridGroup").attr("display", "none");
  d3.select("#mainSVG").style("background-color", modSelectedColor.bgColor);
  var edges = d3.selectAll(".link")
                .style("marker-end", function() {
                  var marker = d3.select(this).style("marker-end");
                  return marker;
                });

  // Set svg viewport so that all objects are visible in image, even if clipped by window:
  var extent = getGraphExtent(d3, shapes);
  var mainSVG = d3.select("#mainSVG");
  var previousW =  mainSVG.attr("width"); // Save for restoring after image is generated
  var previousH = mainSVG.attr("height"); // "                                         "
  mainSVG.attr("width", extent.w)
         .attr("height", extent.h)
         .style("font-size", modText.defaultFontSize) // export to image sees no css
         .style("overflow", "visible");

  // Make credits visible:
  d3.select("#credits")
    .attr("display", "block")
    .attr("y", extent.h - 30)
   .text("Generated " + Date() + " by System Support Mapper (Copyright (C) 2014-2015 UNC-CH)");

  // Create canvas:
  d3.select("body").append("canvas")
    .attr("width", extent.w)
    .attr("height", extent.h);
  var canvas = document.querySelector("canvas");
  var context = canvas.getContext("2d");

  // Create event handler to draw svg onto canvas, convert to image, and export .png:
  var image = new Image();
  image.onload = function() {
    context.drawImage(image, 0, 0);
    var canvasData = canvas.toDataURL("image/png");
    var pngImage = '<img src="' + canvasData + '">';
    d3.select("#pngdataurl").html(pngImage);
    var a = document.createElement("a");
    a.download = "SystemSupportMap.png";
    a.href = canvasData;
    a.click();
  };
  image.onerror = function imageErrorHandler(event) {
    alert("Export to image failed");
  };

  var html = mainSVG.attr("version", 1.1)
                    .attr("xmlns", "http://www.w3.org/2000/svg")
                    .node().parentNode.innerHTML;
  var imgsrc = "data:image/svg+xml;base64," + btoa(html);
  var img = '<img src="' + imgsrc + '">';
  d3.select("#svgdataurl").html(img);
  image.src = imgsrc;

  // Reset dimensions and attributes for normal appearance and interactive behavior:
  mainSVG.attr("width", previousW)
         .attr("height", previousH)
         .style("overflow", "hidden");
  shapes.style("fill", undefined);
  d3.selectAll(".ssmCircle, .cOfC").style("fill", "none");
  d3.select("#credits").attr("display", "none");
  modUpdate.updateGraph(d3);
  canvas.remove();
};

},{"./circles-of-care.js":4,"./selected-color.js":22,"./system-support-map.js":27,"./text.js":28,"./update.js":31}],14:[function(require,module,exports){
var modSerialize = require('./serialize.js');

// Save as JSON file
exports.setupDownload = function(d3, saveAs, Blob) {
  d3.select("#download-input").on("click", function() {
    var blob = new Blob([window.JSON.stringify(modSerialize.getMapObject(d3))],
                        {type: "text/plain;charset=utf-8"});
    saveAs(blob, "SystemSupportMap.json");
  });
};

// Open/read JSON file
exports.setupUpload = function(d3) {
  d3.select("#upload-input").on("click", function() {
    document.getElementById("hidden-file-upload").click();
  });

  d3.select("#hidden-file-upload").on("change", function() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var uploadFile = this.files[0];
      var filereader = new window.FileReader();
      var txtRes;

      filereader.onload = function() {
        try {
          txtRes = filereader.result;
        } catch(err) {
          window.alert("Error reading file: " + err.message);
        }
        return modSerialize.importMap(d3, JSON.parse(txtRes));
      };
      filereader.readAsText(uploadFile);
    } else {
      alert("Your browser won't let you read this file -- try upgrading your browser to IE 10+ "
            + "or Chrome or Firefox.");
    }
  });
};

},{"./serialize.js":25}],15:[function(require,module,exports){
exports.addLogos = function(d3) {
  d3.select("#mainSVG").append("svg:image")
    .attr("xlink:href", "mch-tracs.png")
    .attr("id", "logos")
    .attr("width", 546)
    .attr("height", 60)
    .attr("x", -52)
    .attr("y", 0);
};

exports.addCopyright = function(d3) {
  d3.select("#topGraphDiv").append("div")
    .attr("id", "copyrightDiv")
    .append("text")
    .attr("id", "copyright")
    .text("\u00a9 2014-2015 The University of North Carolina at Chapel Hill");
};

exports.addCredits = function(d3) {
  d3.select("#mainSVG").append("text")
    .attr("id", "credits")
    .attr("display", "none")
    .attr("x", 30);
};

},{}],16:[function(require,module,exports){
var modCirclesOfCare = require('./circles-of-care.js'),
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
  if (modOptionsMenu.displayAll) {
    modCirclesOfCare.create(d3);
  }
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

},{"./circles-of-care.js":4,"./context-menu.js":6,"./database.js":7,"./drag.js":8,"./events.js":12,"./file.js":14,"./front-matter.js":15,"./options-menu.js":21,"./selected-color.js":22,"./svg.js":26,"./system-support-map.js":27,"./toolbox.js":29,"./tooltips.js":30,"./zoom.js":34}],17:[function(require,module,exports){
// This file is necessary to break a circular dependency between the grid and
// zoom modules. JST 2015-10-21
exports.translate = [0, 0];
exports.zoom = 1;

exports.fitGridToZoom = function(d3) {
  var reverseTranslate = exports.translate;
  reverseTranslate[0] /= -exports.zoom;
  reverseTranslate[1] /= -exports.zoom;
  d3.select("#gridGroup")
    .attr("transform", "translate(" + reverseTranslate + ")");
};

},{}],18:[function(require,module,exports){
var modGridZoom = require('./grid-zoom.js');

var gridVisible = false,
    grid = null,
    gridCellW = 10,
    gridCellH = 10;

var generateGridLineEndPoints = function(d3) {
  var data = [];
  var topDiv = d3.select("#topGraphDiv");
  var bcr = d3.select("#mainSVG").node().getBoundingClientRect();
  var maxX = bcr.width / modGridZoom.zoom, maxY = bcr.height / modGridZoom.zoom;
  var x1 = 0, y1 = 0, x2 = 0, y2 = maxY, n = 0;
  // Create fewer gridlines when zooming out:
  var w = modGridZoom.zoom > 0.2 ? gridCellW
                                 : (modGridZoom.zoom > 0.02 ? gridCellW * 4
                                                            : gridCellW * 40);
  var h = modGridZoom.zoom > 0.2 ? gridCellH
                                 : (modGridZoom.zoom > 0.02 ? gridCellH * 4
                                                            : gridCellH * 40);
  while(x1 <= maxX) {
    data.push({
      "x1": x1,
      "y1": y1,
      "x2": x2,
      "y2": y2,
      "orientation": "Vert",
      "n": n++
    });
    x1 += parseFloat(w);
    x2 = x1;
  }
  x1 = 0, y1 = 0, x2 = maxX, y2 = 0, n = 0;
  while(y1 <= maxY) {
    data.push({
      "x1": x1,
      "y1": y1,
      "x2": x2,
      "y2": y2,
      "orientation": "Horiz",
      "n": n++
    });
    y1 += parseFloat(h);
    y2 = y1;
  }
  return data;
};

var showSnapToGridText = function(d3) {
  d3.select("#snapToGridItem").text("Snap to grid")
    .datum({"name": "Snap to grid"});
};

var show = function(d3) {
  d3.select("#gridGroup").classed("visible", true);
  gridVisible = true;
};

exports.hide = function(d3) {
  d3.select("#gridGroup").classed("visible", false);
  gridVisible = false;
  showSnapToGridText(d3);
};

exports.hideText = 'Turn off grid';

var showTurnOffGridText = function(d3) {
  d3.select("#snapToGridItem").text(exports.hideText)
    .datum({"name": exports.hideText});
};

exports.snap = function(d) {
  if (gridVisible) {
    var leftGridlineDist = d.x % gridCellW;
    var upperGridlineDist = d.y % gridCellH;
    d.x += (leftGridlineDist <= gridCellW / 2) ? -leftGridlineDist
      : gridCellW - leftGridlineDist;
    d.y += (upperGridlineDist <= gridCellH / 2) ? -upperGridlineDist
      : gridCellH - upperGridlineDist;
  }
};

exports.create = function(d3) {
  if (grid) {
    grid.remove();
    grid = null;
  }
  grid = d3.select("#graphG").insert("g", ":first-child")
    .attr("id", "gridGroup")
    .classed("visible", gridVisible);
  var data = generateGridLineEndPoints(d3);
  d3.select("#gridGroup").selectAll("line")
    .data(data)
    .enter().append("svg:line")
    .attr("x1", function(d) { return d.x1; })
    .attr("x2", function(d) { return d.x2; })
    .attr("y1", function(d) { return d.y1; })
    .attr("y2", function(d) { return d.y2; })
    .attr("id", function(d, i) {
      return "gridline" + d.orientation + d.n;
    })
    .style("stroke", "#000000")
    .style("stroke-width", function(d) { return (d.n % 4) ? "0.1px" : "0.5px"; })
    .style("stroke-dasharray", ("1, 1"))
    .style("fill", "none");
  modGridZoom.fitGridToZoom(d3);
};

exports.enableSnap = function(d3) {
  if (!grid) {
    exports.create(d3);
  }
  show(d3);
  showTurnOffGridText(d3);
};

},{"./grid-zoom.js":17}],19:[function(require,module,exports){
// Help/instructions button and info box:
module.exports = function(d3) {
  d3.select("#toolbox").insert("div", ":first-child")
    .attr("id", "btnDiv")
    .append("input")
    .attr("type", "button")
    .attr("id", "helpBtn")
    .attr("value", "?")
    .on("click", function() {
      alert("\u26a1 Drag/scroll to translate/zoom.\n"
        + "\u26a1 Click on a shape in the toolbar to select node shape (or for a node with "
            + "none use \"no border\").\n"
        + "\u26a1 Click on a color in the toolbar to select a color for creating new nodes "
            + "and edges.\n"
        + "\u26a1 Shift-click on empty space to create a node of the selected shape and "
            + "color.\n"
        + "\u26a1 Click on an arrow in the toolbar to select edge style: dashed or solid.\n"
        + "\u26a1 Shift-click on a node, then drag to another node to connect them with an "
        + "edge.\n"
        + "\u26a1 Shift-click on a node's text to edit.\n"
        + "\u26a1 Shift-click on an edge to edit text.\n"
        + "\u26a1 Click on node or edge to select and press backspace/delete to delete."
            + " Note: a node's background turns blue when you're hovering over it, and pink when "
            + "selected.\n"
        + "\u26a1 Control-click on a node with underlined text to open the external url "
            + "associated with that node.\n"
        + "\u26a1 Alt-click on a node to see, attach new (or change existing) url.\n"
        + "\u26a1 Control-shift-click on a node to attach or modify note.\n"
        + "\u26a1 Hover over a node to see its note if there is one attached.\n"
        + "\u26a1 Click on the cloud with the up-arrow to open/upload a file from your machine.\n"
        + "\u26a1 Click on the square with the down-arrow to save the graph to your computer.\n"
        + "\nQuestions? Email stevec@renci.org."
     );
  });
};

},{}],20:[function(require,module,exports){
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * Copyright (C) 2014-2015 The University of North Carolina at Chapel Hill
 * All rights reserved.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS, CONTRIBUTORS, AND THE
 * UNIVERSITY OF NORTH CAROLINA AT CHAPEL HILL "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED * TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
 * EVENT SHALL THE COPYRIGHT OWNER, CONTRIBUTORS OR THE UNIVERSITY OF NORTH
 * CAROLINA AT CHAPEL HILL BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY * OF SUCH DAMAGE.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Build a graph with nodes of several shapes and colors, and connect them with
// directed edges. Save a constructed graph locally as a json file, and open and
// display saved graph files.
// Based on Colorado Reed's https://github.com/cjrd/directed-graph-creator.

document.onload = (function(d3) {
  "use strict";

  var modAuth = require('./auth.js'),
      modDatabase = require('./database.js'),
      modEvents = require('./events.js'),
      modGraph = require('./graph.js'),
      modSvg = require('./svg.js'),
      modUpdate = require('./update.js'),
      modWizard = require('./wizard.js');

  window.onbeforeunload = function() {
    return "Make sure to save your graph locally before leaving.";
  };

  modAuth.afterAuthentication(d3, function() {
    modSvg.setup(d3);
    modGraph.create(d3);
    modEvents.shapeId = 0;
    modUpdate.updateGraph(d3);
    if (!modDatabase.loadMapFromLocation(d3)) {
      // blank slate; open wizard
      modWizard.showWizard(d3);
    }
    window.showWizard = function() { modWizard.showWizard(d3); };
    window.hideWizard = function() { modWizard.hideWizard(d3); };
  });
})(window.d3);

},{"./auth.js":2,"./database.js":7,"./events.js":12,"./graph.js":16,"./svg.js":26,"./update.js":31,"./wizard.js":33}],21:[function(require,module,exports){
var modAuth = require('./auth.js'),
    modCirclesOfCare = require('./circles-of-care.js'),
    modContextMenu = require('./context-menu.js'),
    modEdgeThickness = require('./edge-thickness.js'),
    modExport = require('./export.js'),
    modGrid = require('./grid.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelectedShape = require('./selected-shape.js'),
    modSelection = require('./selection.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modText = require('./text.js'),
    modUpdate = require('./update.js');

exports.displayAll = true; // If false turns off some features

var createEqShapeSizeSubmenu = function(d3) {
  d3.select("#eqShapeSizeItem").append("div")
    .classed("menuHidden", true).classed("menu", false)
    .attr("id", "eqShapeSizeSubmenuDiv")
    .attr("position", "absolute")
    .style("width", "200px")
    .on("mouseleave", function() {
      d3.select("#eqShapeSizeSubmenuDiv").classed("menu", false).classed("menuHidden", true);
    })
    .on("mouseup", function() {
      d3.select("#eqShapeSizeSubmenuDiv").classed("menu", false).classed("menuHidden", true);
    });
  var choices = [{"name": "Equalize selected shape size"},
                 {"name": "Equalize sizes for all shapes"}];

  d3.select("#eqShapeSizeSubmenuDiv").append("ul").attr("id", "eqShapeSizeSubmenuList");
  d3.select("#eqShapeSizeSubmenuList").selectAll("li.eqShapeSizeSubmenuListItem")
    .data(choices).enter()
    .append("li")
      .classed("eqShapeSizeSubmenuListItem", true)
      .attr("id", function(d, i) { return "eqShapeSizeOption" + i; })
      .text(function(d) { return d.name; })
      .on("mouseup", function() {
        d3.select("#eqShapeSizeSubmenuDiv").classed("menu", false).classed("menuHidden", true);
        d3.select("#optionsMenuDiv")
          .classed("menu", false).classed("menuHidden", true);

        switch (d3.select(this).datum().name) {
          case choices[0].name:
            modSelectedShape.equalizeSelectedShapeSize(d3, modSelectedShape.shape);
            break;
          case choices[1].name:
            var shapes = ["circle", "rectangle", "diamond", "ellipse", "star", "noBorder"];
            for (var i = 0; i < shapes.length; i++) {
              modSelectedShape.equalizeSelectedShapeSize(d3, shapes[i]);
            }
            break;
          default:
            alert("\"" + d.name + "\" item is not implemented.");
            break;
        }
      });
};

var createTextLineLengthSubmenu = function(d3) {
  var maxCharsPerLine = modText.maxCharsPerLine;
  d3.select("#setTextLineLenItem").append("div")
    .classed("menuHidden", true).classed("menu", false)
    .attr("id", "textLineLengthSubmenuDiv")
    .attr("position", "absolute")
    .style("width", "120px")
    .on("mouseleave", function() {
      d3.select("#textLineLengthSubmenuDiv").classed("menu", false).classed("menuHidden", true);
    })
    .on("mouseup", function() {
      d3.select("#textLineLengthSubmenuDiv").classed("menu", false).classed("menuHidden", true);
    });
  var choices = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  d3.select("#textLineLengthSubmenuDiv").append("ul").attr("id", "textLineLengthSubmenuList");
  d3.select("#textLineLengthSubmenuList").selectAll("li.textLineLengthSubmenuListItem")
    .data(choices).enter()
    .append("li")
      .classed("textLineLengthSubmenuListItem", true)
      .attr("id", function(d, i) { return "edgeThicknessOption" + i; })
      .text(function(d) { return d + " characters"; })
      .style("text-shadow", function() {
        return (parseInt(d3.select(this).datum(), 10) === maxCharsPerLine)
          ? "1px 1px #000000" : "none"; })
      .style("color", function() {
        return (parseInt(d3.select(this).datum(), 10) === maxCharsPerLine)
          ? modSelectedColor.color : modSelectedColor.unselected;
      })
      .on("mouseup", function() {
        modText.maxCharsPerLine = parseInt(d3.select(this).datum(), 10);
        d3.select("#textLineLengthSubmenuDiv").classed("menu", false).classed("menuHidden", true);
        d3.select("#menuDiv")
          .classed("menu", false).classed("menuHidden", true);
        d3.selectAll(".textLineLengthSubmenuListItem")
          .style("color", modSelectedColor.unselected)
          .style("text-shadow", "none");
        d3.select(this)
          .style("color", modSelectedColor.color)
          .style("text-shadow", "1px 1px #000000");
      });
};

// Set the currently selected shape to the currently selected color. Generate
// an error message if no shape is selected.
var setSelectedObjectColor = function(d3) {
  var selectedObject = modSelection.selectedNode || modSelection.selectedEdge;
  if (!selectedObject) {
    alert("setSelectedObjectColor: no object selected.");
    return;
  }
  selectedObject.color = modSelectedColor.clr;
  var selectedElement = d3.select("#" + selectedObject.domId);
  selectedElement.select(".shape").style("stroke", modSelectedColor.clr);
  selectedElement.select("text").style("fill", modSelectedColor.clr);
  modUpdate.updateGraph(d3);
};

exports.createOptionsMenu = function(d3) {
  var choices = null;
  if (exports.displayAll) {
    choices = [{"name": "Show system support rings", "id": "sysSptRingsItem"},
               {"name": "Show Circles of Care", "id": "cOfCItem"},
               {"name": "Equalize shape size...", "id": "eqShapeSizeItem"},
               {"name": "Set text line length...", "id": "setTextLineLenItem"},
               {"name": "Set line thickness...", "id": "setLineThicknessItem"},
               {"name": "Set selected object color", "id": "setSelectedObjectColorItem"},
               {"name": "Snap to grid", "id": "snapToGridItem"},
               {"name": "Export map as image", "id": "exportMapAsImageItem"},
               {"name": "Load text for context menu", "id": "loadContextTextItem"},
               {"name": "Log out", "id": "logoutUser"}];
  } else {
    choices = [{"name": "Equalize shape size...", "id": "eqShapeSizeItem"},
               {"name": "Set text line length...", "id": "setTextLineLenItem"},
               {"name": "Set line thickness...", "id": "setLineThicknessItem"},
               {"name": "Export map as image", "id": "exportMapAsImageItem"},
               {"name": "Load context text", "id": "loadContextTextItem"},
               {"name": "Log out", "id": "logoutUser"}];
  }
  d3.select("#topGraphDiv").insert("div", ":first-child")
    .classed("menuHidden", true).classed("menu", false)
    .attr("id", "optionsMenuDiv")
    .attr("position", "absolute")
    .on("mouseleave", function() {
      d3.select("#optionsMenuDiv")
          .classed("menu", false).classed("menuHidden", true);
    });
  d3.select("#optionsMenuDiv").append("ul").attr("id", "optionsMenuList");
  d3.select("#optionsMenuList").selectAll("li.optionsMenuListItem")
    .data(choices).enter()
    .append("li")
      .classed("optionsMenuListItem", true)
      .attr("id", function(d, i) { return d.id; })
      .text(function(d) { return d.name; })
      .on("mouseover", function(d) {
        if (d.id === "eqShapeSizeItem") {
          d3.select("#eqShapeSizeSubmenuDiv")
            .classed("menu", true).classed("menuHidden", false);
        } else if (d.id === "setTextLineLenItem") {
          d3.select("#textLineLengthSubmenuDiv")
            .classed("menu", true).classed("menuHidden", false);
        } else if (d.id === "setLineThicknessItem") {
          d3.select("#edgeThicknessSubmenuDiv")
            .classed("menu", true).classed("menuHidden", false);
        }
      })
      .on("mouseout", function(d) {
        if (d.id === "eqShapeSizeItem") {
          d3.select("#eqShapeSizeSubmenuDiv").classed("menu", false).classed("menuHidden", true);
        } else if (d.id === "setTextLineLenItem") {
          d3.select("#textLineLengthSubmenuDiv")
           .classed("menu", false).classed("menuHidden", true);
        } else if (d.id === "setLineThicknessItem") {
          d3.select("#edgeThicknessSubmenuDiv")
           .classed("menu", false).classed("menuHidden", true);
        }
      })
      .on("mouseup", function(d) {
        exports.optionsMenuListItemMouseUp(d3, this, d, choices);
      });

  createEqShapeSizeSubmenu(d3);
  createTextLineLengthSubmenu(d3);
  modEdgeThickness.createSubmenu(d3);
};

exports.optionsMenuListItemMouseUp = function(d3, listItem, d, choices) {
  // Hide the menu unless there's a submenu open:
  if ((d.id !== "eqShapeSizeItem") && (d.id !== "setTextLineLenItem")
                                   && (d.id !== "setLineThicknessItem")) {
    d3.select("#optionsMenuDiv").classed("menu", false).classed("menuHidden", true);
  }

  if (exports.displayAll) {
    switch (d3.select(listItem).datum().name) {
    // Beware: d3.select(listItem).text() returns concatenation of all submenu text.
      case choices[0].name:
        modSystemSupportMap.show(d3);
        break;
      case modSystemSupportMap.hideText:
        modSystemSupportMap.hide(d3);
        break;
      case choices[1].name:
        modCirclesOfCare.show(d3);
        break;
      case modCirclesOfCare.hideText:
        modCirclesOfCare.hide(d3);
        break;
      case choices[2].name:
      case choices[3].name:
      case choices[4].name:
        break; // These menu items have submenus with their own event handlers
      case choices[5].name:
        setSelectedObjectColor(d3);
        break;
      case choices[6].name:
        modGrid.enableSnap(d3);
        break;
      case modGrid.hideText:
        modGrid.hide(d3);
        break;
      case modSystemSupportMap.hideText:
        modSystemSupportMap.hide(d3);
        break;
      case choices[7].name:
        modExport.exportGraphAsImage(d3);
        break;
      case choices[8].name:
        modContextMenu.loadFromClient(d3);
        break;
      case choices[9].name:
        modAuth.logoutUser(d3);
        break;
      default:
        alert("\"" + d.name + "\" not implemented.");
    }
  } else {
    if (d3.select(listItem).datum().id === "exportMapAsImageItem") {
      modExport.exportGraphAsImage(d3);
    } else if (d3.select(listItem).datum().id === "loadContextTextItem") {
      modContextMenu.loadFromClient(d3);
    } else if (d3.select(listItem).datum().id === "logoutUser") {
      modAuth.logoutUser(d3);
    }
  }
};

exports.createOptionsButton = function(d3) {
  d3.select("#btnDiv").append("input")
    .attr("type", "button")
    .attr("id", "optionsBtn")
    .attr("value", "Options")
    .on("click", function() {
      var position = d3.mouse(d3.select("#topGraphDiv")[0][0]);
      position[1] -= 120;
      d3.select("#optionsMenuDiv")
        .classed("menuHidden", false).classed("menu", true)
        .style("left", position[0] + "px")
        .style("top", position[1] + "px");
    });
};

},{"./auth.js":2,"./circles-of-care.js":4,"./context-menu.js":6,"./edge-thickness.js":10,"./export.js":13,"./grid.js":18,"./selected-color.js":22,"./selected-shape.js":23,"./selection.js":24,"./system-support-map.js":27,"./text.js":28,"./update.js":31}],22:[function(require,module,exports){
var modEdgeStyle = require('./edge-style.js'),
    modSelectedShape = require('./selected-shape.js');

exports.color = "rgb(229, 172, 247)";
exports.unselected = "#666666";
exports.colorChoices = ["ff0000",  // red
                        "ff8800",  // orange
                        "999900",  // gold
                        "00bd00",  // green
                        "00bdbd",  // cyan/aqua
                        "0000ff",  // dark blue
                        "8800ff",  // purple
                        "000000"], // black
exports.hoverColor = "rgb(200, 238, 241)";
exports.bgColor = "rgb(248, 248, 248)";
exports.clr = '#000000';

exports.createColorPalette = function(d3) {
  d3.select("#toolbox").insert("div", ":first-child")
    .attr("id", "colorPalette");
  d3.select("#colorPalette").selectAll(".colorBar")
    .data(exports.colorChoices)
    .enter().append("div")
      .classed("colorBar", true)
      .attr("id", function(d) { return "clr" + d; })
      .style("background-color", function(d) { return "#" + d; })
    .on("mouseover", function() { // Set border to hoverColor if this colorBar is not selected
      var currentColorBar = d3.select(this);
      var currentIdFragment = currentColorBar.attr("id").slice(3);
      if (currentIdFragment !== exports.clr.slice(1)) {
        currentColorBar.style("border-color", exports.hoverColor);
      }
    })
    .on("mouseout", function() { // Set border to black if this colorBar is not selected
      var currentColorBar = d3.select(this);
      var currentIdFragment = currentColorBar.attr("id").slice(3);
      if (currentIdFragment !== exports.clr.slice(1)) {
        currentColorBar.style("border-color", "#000000");
      }
    })
    .on("mouseup", function(d) {
      exports.clr = "#" + d;
      d3.selectAll(".colorBar").each(function() {
        d3.select(this).style("border-color", "#000000");});
      d3.select(this).style("border-color", "#ffffff");
      d3.select("#" + modSelectedShape.shape + "Selection")
        .style("stroke", (modSelectedShape.shape === "noBorder") ? "none" : exports.clr)
        .style("fill", (modSelectedShape.shape === "noBorder") ? exports.clr
                                                                : exports.bgColor);
      var selectedEdgeStyleId = (modEdgeStyle.style === "solid")
                              ? "#solidEdgeSelection" : "#dashedEdgeSelection";
      d3.select(selectedEdgeStyleId).style("stroke", exports.clr)
        .style("marker-end", function() {
          return "url(#end-arrow" + exports.clr.substr(1) + ")";
      });
    });
  d3.select("#clr000000").style("border-color", "#ffffff"); // Initial color selection is black
};

},{"./edge-style.js":9,"./selected-shape.js":23}],23:[function(require,module,exports){
var modSelectedColor = require('./selected-color.js'),
    modSvg = require('./svg.js'),
    modUpdate = require('./update.js');

exports.minCircleRadius = 20;
var ssCircleCy = exports.minCircleRadius * 2 - 16; // ShapeSelectionCircleCy
exports.minRectSide =
  Math.sqrt(Math.PI * exports.minCircleRadius * exports.minCircleRadius);
exports.sssw = exports.minCircleRadius * 4 + 23; // Shape Selection Svg Width
var sssh = exports.minCircleRadius * 13; // Shape Selection Svg Height
exports.minEllipseRx = 25;
exports.minEllipseRy = 17;
exports.esEdgeX1 = exports.sssw / 5 - 20;
exports.shape = 'circle';

var ssRectangleY = 49; // "ss" -> shape selection
var ssDiamondY = 16;
var ssEllipseCy = 154;
var ssNoBorderXformY = 163;

var selectShape = function(d3, selectedElt, shapeSelection) {
  d3.selectAll(".shapeSelection").style("stroke", modSelectedColor.unselected)
    .classed({"sel": false, "unsel": true});
  d3.select("#noBorderSelection")
    .style("fill", modSelectedColor.unselected)
    .style("stroke", "none");
  selectedElt.style("stroke", modSelectedColor.clr).classed({"sel": true, "unsel": false});
  if (shapeSelection === "noBorder") {
    selectedElt.style("fill", modSelectedColor.clr).style("stroke", "none");
  }
  exports.shape = shapeSelection;
};

var addShapeSelectionShapes = function(d3) {
  var data = [{"shape": "circle", "id": "circleSelection"},
              {"shape": "rect", "id": "rectangleSelection"},
              {"shape": "rect", "id": "diamondSelection"},
              {"shape": "ellipse", "id": "ellipseSelection"},
              {"shape": "polygon", "id": "starSelection"},
              {"shape": "text", "id": "noBorderSelection"}];
  d3.select("#shapeSelectionSvg").selectAll(".shapeSelection")
    .data(data)
    .enter().append(function(d) {
      return document.createElementNS("http://www.w3.org/2000/svg", d.shape);
    })
      .attr("id", function(d) { return d.id; })
      .classed("shapeSelection", true)
      .style("stroke", function(d) {
        return d.shape === "circle" ? modSelectedColor.clr : modSelectedColor.unselected;
      })
      .style("stroke-width", 2)
      .classed("sel", function(d) { return (d.id === "circleSelection"); })
      .classed("unsel", function(d) { return (d.id !== "circleSelection"); })
      .on("click", function(d) {
        selectShape(d3, d3.select(this), d.id.substring(0, d.id.length - 9));
      });
};

// dillieodigital.wordpress.com/2013/01/16/quick-tip-how-to-draw-a-star-with-svg-and-javascript/
var calculateStarPoints = function(ctrX, ctrY, arms, outerRadius, innerRadius) {
  var results = "";
  var angle = Math.PI / arms;
  var rotation = Math.PI / (10 / 3.0); // 1st point up (-y) rather than on the +x axis
  var r, currX, currY;
  var i;
  for (i = 0; i < 2 * arms; i++) {
    r = (i % 2) ? innerRadius : outerRadius; // Alternate outer and inner radii
    currX = ctrX + Math.cos(i * angle + rotation) * r;
    currY = ctrY + Math.sin(i * angle + rotation) * r;
    results += (i > 0) ? ", " + currX + "," + currY : currX + "," + currY;
  }
  return results;
};

var setShapeSelectionShapeSizes = function(d3) {
  d3.select("#circleSelection")
    .attr("r", exports.minCircleRadius)
    .attr("cx", exports.sssw / 2)
    .attr("cy", ssCircleCy);
  d3.select("#rectangleSelection")
    .attr("width", exports.minRectSide)
    .attr("height", exports.minRectSide - 5)
    .attr("x", exports.sssw / 2.0  - exports.minRectSide + 17)
    .attr("y", ssRectangleY);
  d3.select("#diamondSelection")
    .attr("width", exports.minRectSide)
    .attr("height", exports.minRectSide)
    .attr("transform", "rotate(45," + exports.minRectSide * 2 + ","
                                    + ssDiamondY + ")")
    .attr("x", exports.sssw / 2.0 + 53)
    .attr("y", ssDiamondY + 62);
  d3.select("#ellipseSelection")
    .attr("cx", exports.sssw / 2)
    .attr("cy", ssEllipseCy)
    .attr("rx", exports.minEllipseRx)
    .attr("ry", exports.minEllipseRy);
  var starCtrX = exports.minEllipseRx * 2;
  var starCtrY = ssNoBorderXformY + exports.minRectSide * 0.7 + 18;
  d3.select("#starSelection")
    .attr("x", starCtrX)
    .attr("y", starCtrY)
    .attr("points", calculateStarPoints(starCtrX, starCtrY, 5, 30, 15));
  d3.select("#noBorderSelection")
    .attr("x", exports.minEllipseRx * 2)
    .attr("y", ssNoBorderXformY + exports.minRectSide * 0.7 + 58)
    .style("fill", modSelectedColor.unselected)
    .style("stroke", "none")
    .attr("text-anchor","middle")
    .text("no border");
};

// For star shapes.
var computeInnerRadius = function(pointArray) {
  var innerPoint = pointArray[1].split(",");
  var x = parseFloat(innerPoint[0]);
  var y = parseFloat(innerPoint[1]);
  return Math.sqrt(x * x + y * y);
};

exports.addShapeSelection = function(d3) {
  d3.select("#toolbox").insert("div", ":first-child")
    .attr("id", "shapeSelectionDiv");
  d3.select("#shapeSelectionDiv").append("svg")
    .attr("id", "shapeSelectionSvg")
    .attr("width", exports.sssw)
    .attr("height", sssh)
    .attr({"xmlns": "http://www.w3.org/2000/svg",
           "xmlns:xlink": "http://www.w3.org/1999/xlink",
           version: "1.1"
          });
  addShapeSelectionShapes(d3);
  setShapeSelectionShapeSizes(d3);
};

// Set shape size and position, to stored value[s] if they exist, or else to
// fit text.
exports.setShapeSizeAndPosition = function(d3, gEl, el, d) {
  var textSize = el.node().getBBox();
  var rectWidth = Math.max(textSize.width, exports.minRectSide);
  var rectHeight = Math.max(textSize.height, exports.minRectSide);
  var maxTextDim = Math.max(textSize.width, textSize.height);
  var innerRadius = Math.max(14, maxTextDim * 0.6);
  var minDiamondDim = 45;
  var w, h; // for handle translation

  gEl.select(".circle")
     .attr("r", function(d) {
       return d.r || Math.max(maxTextDim / 2 + 8, exports.minCircleRadius);
     });
  gEl.select(".rectangle, .noBorder")
     .attr("width", function(d) {
       w = d.width || rectWidth + 6;
       return w;
     })
     .attr("height", function(d) { // Assume d.width is undefined when we want shrinkwrap
       h = d.height || rectHeight + 4;
       return h;
     })
     .attr("x", function(d) { // Don't check for d.x: that's always there anyway
        var newX = d.manualResize
                 ? -d.xOffset
                 : (d.width ? -d.width / 2 : -rectWidth / 2 - 3);
       return newX;
     })
     .attr("y", function(d) {
       var textAdjust = 1;
        var newY = d.manualResize
                 ? -d.yOffset
                 : (d.width ? -d.height / 2 - textAdjust : -rectHeight / 2 - textAdjust);
       return newY;
     });

  var handle = d3.select("#handle" + d.id);
  if (handle.node()) {
    handle.attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")");
  }

  gEl.select(".diamond")
     .attr("d", function(d) {
       var dim = d.dim || Math.max(maxTextDim * 1.6, minDiamondDim);
       return "M " + dim / 2 + " 0 L " + dim + " " + dim / 2 + " L " + dim / 2 + " " + dim
         + " L 0 " + dim / 2 + " Z";
     })
     .attr("transform", function (d) {
       var dim = d.dim || Math.max(maxTextDim * 1.6, minDiamondDim);
       return "translate(-" + dim / 2 + ",-" + dim /2 + ")";
     });
  gEl.select("ellipse")
     .attr("rx", function(d) {
       return d.rx || Math.max(textSize.width / 2 + 20, exports.minEllipseRx);
     })
     .attr("ry", function(d) {
       return d.ry || Math.max(textSize.height / 2 + 17, exports.minEllipseRy);
     });
  gEl.select("polygon")
     .attr("points", function(d) {
       return d.innerRadius
         ? calculateStarPoints(0, 0, 5, d.innerRadius * 2, d.innerRadius)
         : calculateStarPoints(0, 0, 5, innerRadius * 2, innerRadius);
     })
};

exports.equalizeSelectedShapeSize = function(d3, shape) {
  var selectedClassName = "." + shape;
  var selectedShapes = d3.selectAll(selectedClassName);
  var rMax = 0;             // circle
  var wMax = 0, hMax = 0;   // rectangle, noBorder
  var dMax = 0;             // diamond
  var rxMax = 0, ryMax = 0; // ellipse
  var innerRadius = 0;      // star

  selectedShapes.each(function(d) { // Get max dimensions for "shape" in the current graph
    var thisShapeElt = d3.select(this);
    switch (d.shape) {
      case "circle":
        rMax = Math.max(rMax, thisShapeElt.attr("r"));
        break;
      case "rectangle":
      case "noBorder":
        if (!d.manualResize) { // Ignore Manually Resized Rectangles
          wMax = Math.max(wMax, thisShapeElt.attr("width"));
          hMax = Math.max(hMax, thisShapeElt.attr("height"));
        }
        break;
      case "diamond":
        var pathArray = thisShapeElt.attr("d").split(" ");
        var dim = parseFloat(pathArray[4], 10);
        dMax = Math.max(dMax, dim);
        break;
      case "ellipse":
        rxMax = Math.max(rxMax, thisShapeElt.attr("rx"));
        ryMax = Math.max(ryMax, thisShapeElt.attr("ry"));
        break;
      case "star":
        var thisInnerRadius = computeInnerRadius(thisShapeElt.attr("points")
      .split(" "));
        innerRadius = Math.max(thisInnerRadius, innerRadius);
        break;
      default:
        alert("selectedShapes.each(): unknown shape \"" + d.shape + "\"");
    }
  });

  switch (shape) { // Apply max dimensions previously acquired to all instances of "shape"
    case "circle":
      selectedShapes.attr("r", rMax);
      break;
    case "rectangle":
    case "noBorder":
      // Don't include Manually Resized Rectangles in the shape size equalization process:
      var nonMRRs = selectedShapes.filter(function(element, index, array) {
        return !element.manualResize;
      });
      nonMRRs.attr("width", wMax)
                    .attr("height", hMax)
                    .attr("x", -wMax / 2)
                    .attr("y", -hMax / 2 - 4);
      break;
    case "diamond":
      selectedShapes.attr("d", function() {
        return "M " + dMax / 2 + " 0 L " + dMax + " " + dMax / 2 + " L " + dMax / 2 + " " + dMax
                    + " L 0 " + dMax / 2 + " Z";
      })
      .attr("transform", function () { return "translate(-" + dMax / 2 + ",-" + dMax /2 + ")"; });
      break;
    case "ellipse":
      selectedShapes.attr("rx", rxMax).attr("ry", ryMax);
      break;
    case "star":
      selectedShapes.attr("points",
        calculateStarPoints(0, 0, 5, innerRadius * 2, innerRadius));
      break;
    default:
      alert("equalizeSelectedShapeSize(): unknown shape \"" + d.shape + "\"");
      break;
  }

  modSvg.shapeGroups.each(function(d) {
    exports.storeShapeSize(d3.select(this), d);
  });
  modUpdate.updateExistingPaths();
  modUpdate.updateGraph(d3);
};

exports.storeShapeSize = function(gEl, d) {
  var pad = 12;
  switch (gEl[0][0].__data__.shape) {
    case "rectangle":
    case "noBorder":
      d.width = gEl.select("rect").attr("width"); // Store for computeRectangleBoundary(...)
      d.height = gEl.select("rect").attr("height");
      break;
    case "diamond":
      var pathArray = gEl.select("path").attr("d").split(" ");
      d.dim = parseFloat(pathArray[4], 10);
      d.boundary = d.dim / 2 + pad;
      break;
    case "ellipse":
      d.rx = gEl.select("ellipse").attr("rx"); // Store for computeEllipseBoundary(...)
      d.ry = gEl.select("ellipse").attr("ry");
      break;
    case "circle":
      d.r = gEl.select("circle").attr("r");
      d.boundary = parseFloat(d.r) + pad;
      break;
    case "star":
      var innerRadius = computeInnerRadius(gEl.select("polygon").attr("points").split(" "));
      d.innerRadius = innerRadius;
      d.boundary = innerRadius * 2;
      break;
    default: // May be an edge, in which case boundary is not applicable.
      break;
  }
};

},{"./selected-color.js":22,"./svg.js":26,"./update.js":31}],24:[function(require,module,exports){
var modSelectedColor = require('./selected-color.js'),
    modSelection = require('./selection.js'),
    modSvg = require('./svg.js');

exports.selectedEdge = null;
exports.selectedNode = null;
exports.selectedClass = 'selected';

var replaceSelectNode = function(d3Node, nodeData) {
  d3Node.classed(exports.selectedClass, true);
  if (exports.selectedNode) {
    exports.removeSelectFromNode();
  }
  nodeData.domId = d3Node.attr("id");
  exports.selectedNode = nodeData;
};

exports.selectNode = function(d3node, d) {
  if (exports.selectedEdge) {
    exports.removeSelectFromEdge();
  }
  var prevNode = exports.selectedNode;
  if (!prevNode || prevNode.id !== d.id) {
    replaceSelectNode(d3node, d);
  } else {
    exports.removeSelectFromNode();
  }
};

exports.removeSelectFromNode = function() {
  if (!exports.selectedNode) return;
  modSvg.shapeGroups.filter(function(cd) {
    return cd.id === exports.selectedNode.id;
  }).classed(exports.selectedClass, false);
  exports.selectedNode = null;
};

// Includes setting edge color back to its unselected value.
exports.removeSelectFromEdge = function() {
  var deselectedEdgeGroup = modSvg.edgeGroups.filter(function(cd) {
    return cd === exports.selectedEdge;
  }).classed(exports.selectedClass, false);

  deselectedEdgeGroup.select("path")
    .style("stroke", exports.selectedEdge.color)
    .style("marker-end", function(d) {
      var clr = d.color ? d.color.substr(1) : d.target.color.substr(1);
      return "url(#end-arrow" + clr + ")";
    });

  deselectedEdgeGroup.select(".foregroundText")
    .style("fill", exports.selectedEdge.color);
  exports.selectedEdge = null;
};

// Includes setting selected edge to selected edge color.
exports.replaceSelectEdge = function(d3, d3Path, edgeData) {
  if (d3.event.shiftKey) { return; }
  d3Path.classed(exports.selectedClass, true);
  d3Path.select("path")
    .style("stroke", modSelectedColor.color)
    .style("marker-end", "url(#selected-end-arrow)");
  d3Path.select(".foregroundText")
    .style("fill", modSelectedColor.color);
  if (modSelection.selectedEdge) {
    exports.removeSelectFromEdge();
  }
  modSelection.selectedEdge = edgeData;
};

},{"./selected-color.js":22,"./selection.js":24,"./svg.js":26}],25:[function(require,module,exports){
var modCirclesOfCare = require('./circles-of-care.js'),
    modEvents = require('./events.js'),
    modGridZoom = require('./grid-zoom.js'),
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
    "wizardActive": modWizard.wizardActive
  };
  if (modWizard.wizardActive) {
    ret.wizardCurrentStep = modWizard.currentStep;
    ret.wizardCurrentResponsibility = modWizard.currentResponsibility;
    ret.wizardCurrentNeed = modWizard.currentNeed;
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

    if (jsonObj.wizardActive) {
      modWizard.currentStep = jsonObj.wizardCurrentStep;
      modWizard.currentResponsibility = jsonObj.wizardCurrentResponsibility;
      modWizard.currentNeed = jsonObj.wizardCurrentNeed;
      modWizard.inferParentChildRelationships(d3);
      modWizard.showWizard(d3);
    }
  } catch(err) {
    window.alert("Error parsing uploaded file\nerror message: " + err.message);
    return;
  }
};

},{"./circles-of-care.js":4,"./events.js":12,"./grid-zoom.js":17,"./svg.js":26,"./system-support-map.js":27,"./update.js":31,"./wizard.js":33,"./zoom.js":34}],26:[function(require,module,exports){
exports.svg = null;
exports.svgG = null;
exports.nodes = [];
exports.links = [];
exports.shapeGroups = null;
exports.edgeGroups = null;
exports.width = null;
exports.height = null;

exports.setup = function(d3) {
  var wizardEl = document.getElementById('wizard');
  exports.width = window.innerWidth;
  exports.height = window.innerHeight - wizardEl.clientHeight;
  // MAIN SVG:
  d3.select("#topGraphDiv").append("div")
    .attr("id", "mainSVGDiv");
  exports.svg = d3.select("#mainSVGDiv").append("svg")
    .attr("id", "mainSVG")
    .style("font-family", "arial")
    .attr("width", exports.width)
    .attr("height", exports.height);
  // The group that contains the main SVG element:
  exports.svgG = exports.svg.append("g")
    .classed("graph", true)
    .attr("id", "graphG");
};

},{}],27:[function(require,module,exports){
var modSelectedColor = require('./selected-color.js');

exports.hideText = "Hide system support rings";
exports.center = null;
exports.visible = true;
exports.ringRadii = [110, 275, 475, 675, 875];

// Center circles and text in window
exports.show = function(d3) {
  if (!exports.center) {
    exports.center = {
      "x": d3.select("#topGraphDiv").node().clientWidth / 2,
      "y": d3.select("#topGraphDiv").node().clientHeight / 2};
  }
  var ssmCenter = exports.center;
  d3.select(".ssmGroup")
    .classed({"ssmHidden": false, "ssmVisible": true});
  exports.visible = true;
  d3.selectAll(".ssmCircle")
    .attr("cx", ssmCenter.x)
    .attr("cy", ssmCenter.y);
  d3.selectAll(".ssmLabel")
    .style("font-size", "12px")
    .attr("x", function() {
      return ssmCenter.x - this.getComputedTextLength() / 2;
    })
    .attr("y", function(d, i) {
      var offset = [20, 28, 26, 18, 64];
      return ssmCenter.y - d.radius + offset[i];
    });
  d3.select("#sysSptRingsItem").text(exports.hideText)
    .datum({"name": exports.hideText});
};

exports.hide = function(d3) {
  exports.center = null;
  d3.select(".ssmGroup")
    .classed({"ssmHidden": true, "ssmVisible": false});
  exports.visible = false;
  d3.select("#sysSptRingsItem").text("Show system support rings")
    .datum({"name": "Show system support rings"});
};

// Create four concentric rings and five labels (one for each rings and one for
// the outside)
exports.create = function(d3) {
  var rings = [{"name": "Role/Identity",
                "color": "#" + modSelectedColor.colorChoices[6]},
               {"name": "Most Important Responsibilities",
                "color": "#" + modSelectedColor.colorChoices[5]},
               {"name": "General Needs for Each Responsibility",
                "color": "#" + modSelectedColor.colorChoices[4]},
               {"name": "Available Resources",
                "color": "#" + modSelectedColor.colorChoices[7]}
              ].map(function(d,i) {
                d.radius = exports.ringRadii[i];
                return d;
              });
  d3.select("#graphG").append("g")
    .classed({"ssmGroup": true, "ssmHidden": true, "ssmVisible": false});
  exports.visible = false;
  d3.select(".ssmGroup").selectAll(".ssmCircle")
    .data(rings)
    .enter().append("circle")
      .classed("ssmCircle", true)
      .style("stroke", function(d) {
        return d.color;
      })
      .style("fill", "none")
      .attr("r", function(d) { return d.radius; });
  rings.push({"name": "Wish List", "radius": 750, "color": "#" + modSelectedColor.colorChoices[2]});
  d3.select(".ssmGroup").selectAll(".ssmLabel")
    .data(rings)
    .enter().append("text")
      .classed("ssmLabel", true)
      .style("fill", function(d) { return d.color; })
      .text(function(d) { return d.name; });
};

},{"./selected-color.js":22}],28:[function(require,module,exports){
var modDrag = require('./drag.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelectedShape = require('./selected-shape.js'),
    modSvg = require('./svg.js'),
    modUpdate = require('./update.js');

exports.maxCharsPerLine = 20;
exports.boldFontWeight = 900;
exports.defaultFontSize = 12;
exports.activeEditId = 'active-editing';

var ENTER_KEY = 13;

var appendText = function(gEl, phrases, yShift) {
  var nPhrases = phrases.length;
  var el = gEl.append("text")
        .classed("foregroundText", true)
        .attr("text-anchor","left")
        .attr("alignment-baseline", "middle")
        .attr("text-decoration", function(d) {
          return d.url ? "underline" : "none"; })
        .style("font-weight", function(d) {
          return d.url ? exports.boldFontWeight: "none"; })
        .style("fill", gEl[0][0].__data__.color)
        .attr("dy",  function() {
          return yShift - ((nPhrases - 1) * exports.defaultFontSize / 2);
        });
  el.selectAll("tspan")
    .data(phrases)
    .enter().append("tspan")
    .text(function(d) { return d; })
    .attr("dy", function(d, i) {
      return (i > 0) ? exports.defaultFontSize : null;
    });
  return el;
};

// Split text into single words, then group them into lines. Arg "element" is a
// shape or an edge.
var splitTextIntoLines = function(element) {
  var words = (element.name) ? element.name.split(/\s+/g) : [""];
  var nwords = words.length;
  var phrases = [];
  var wordIx = 0;
  var currPhrase = "";
  var maxChars = exports.maxCharsPerLine;
  if (element.maxCharsPerLine) {
    maxChars = element.maxCharsPerLine;
  } else {
    element.maxCharsPerLine = maxChars;
  }
  while (wordIx < nwords) {
    if (words[wordIx].length >= maxChars) {
      phrases.push(words[wordIx++]);
    } else {
      while ((wordIx < nwords) && ((currPhrase.length + words[wordIx].length) < maxChars)) {
        currPhrase +=  words[wordIx++];
        if ((wordIx < nwords) && ((currPhrase.length + words[wordIx].length) < maxChars)) {
          currPhrase += " ";
        }
      }
      phrases.push(currPhrase);
    }
    currPhrase = "";
  }
  return phrases;
};

var appendEdgeShadowText = function(gEl, phrases, yShift) {
  var tLen = [0]; // Initialize array with 0 so we don't try to access element at -1
  var el = gEl.append("text")
              .attr("text-anchor","left")
              .attr("alignment-baseline", "middle")
              .attr("text-decoration", function(d) { return d.url ? "underline" : "none"; })
              .style("font-weight", function(d) {
                return d.url ? exports.boldFontWeight: "none";
              })
              .style("stroke", modSelectedColor.bgColor)
              .style("stroke-width", "3px")
              .attr("dy",  function() {
                return yShift - ((phrases.length - 1) * exports.defaultFontSize / 2);
              });
  el.selectAll("tspan")
    .data(phrases)
    .enter().append("tspan")
      .text(function(d) { return d; })
      .attr("dx", function(d, i) {
        tLen.push(this.getComputedTextLength());
        // TODO: fix edge text position when source or target shape is very large (needs to be
        // centered from shape borders, not just shape centers).
        return -(tLen[i] + tLen[i + 1]) / 2;
      })
      .attr("dy", function(d, i) { return (i > 0) ? exports.defaultFontSize : null; });
  return tLen;
};

// Select all text in element: taken from
// http://stackoverflow.com/questions/6139107/
// programatically-select-text-in-a-contenteditable-html-element
exports.selectText = function(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

// Based on
// http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts
// Centers text for shapes and edges in lines whose lengths are determined by
// maxCharsPerLine. Shrinkwraps shapes to hold all the text if previously
// determined size not used.
exports.formatText = function(d3, gEl, d) {
  if (d.manualResize) {
    d.name = "";
  }
  var phrases = splitTextIntoLines(d);
  var tLen = null; // Array of lengths of the lines of edge text
  var yShift = 3; // Align text to edges
  if (d.shape && (d.shape !== "rectangle") && (d.shape !== "noBorder")) {
    yShift = 6;
  }
  if (d.source) { // ...then it's an edge: add shadow text for legibility:
    tLen = appendEdgeShadowText(gEl, phrases, yShift);
  }
  var el = appendText(gEl, phrases, yShift);
  if (d.source) { // It's an edge
    el.selectAll("tspan")
      .attr("dx", function(d, i) {
        return -(tLen[i] + tLen[i + 1]) / 2;
      });
  } else { // It's a shape
    el.selectAll("tspan").attr("text-anchor","middle").attr("dx", null).attr("x", 0);
    modSelectedShape.setShapeSizeAndPosition(d3, gEl, el, d);
    modSelectedShape.storeShapeSize(gEl, d);
  }
};

// Place editable text on node or edge in place of svg text
//
// Note: see bug report
// https://code.google.com/p/chromium/issues/detail?id=304567
// "svg foreignObject with contentEditable=true editing/placement inconsistency"
// for possible explanation of some editable text positioning difficulties.
exports.changeElementText = function(d3, d3element, d) {
  var htmlEl = d3element.node();
  d3element.selectAll("text").remove();
  var nodeBCR = htmlEl.getBoundingClientRect(),
      curScale = nodeBCR.width / (modSelectedShape.minCircleRadius * 2),
      useHW = curScale > 1 ? nodeBCR.width * 1.71 : modSelectedShape.minCircleRadius * 4.84;

  // Replace with editable content text:
  var d3txt = modSvg.svg.selectAll("foreignObject")
    .data([d])
    .enter().append("foreignObject")
      .attr("x", nodeBCR.left + nodeBCR.width / 2)
      .attr("y", nodeBCR.top + nodeBCR.height / 2)
      .attr("height", 2 * useHW)
      .attr("width", useHW)
    .append("xhtml:p")
      .attr("id", exports.activeEditId)
      .attr("contentEditable", true)
      .text(d.name)
    .on("mousedown", function() {
      d3.event.stopPropagation();
    })
    .on("keydown", function() {
      d3.event.stopPropagation();
      if (d3.event.keyCode === ENTER_KEY && !d3.event.shiftKey) { this.blur(); }
    })
    .on("blur", function(d) {
      d.name = this.textContent.trim(); // Remove whitespace fore and aft
      if (d.manualResize) {
        modDrag.clickDragHandle = false;
        d.name = "";
      } else {
        // Force shape shrinkwrap:
        d.r = d.width = d.height = d.dim = d.rx = d.ry = d.innerRadius = undefined;
        d.maxCharsPerLine = undefined; // User may want different value if editing text
      }
      exports.formatText(d3, d3element, d);
      d3.select(this.parentElement).remove();
      modUpdate.updateGraph(d3);
    });
  return d3txt;
};

// Instead of entering a mode where the user can edit the text of the node, just
// change it immediately to the given text. Also sets node.name to that text.
exports.changeElementTextImmediately = function(d3, d3element, node, text) {
  node.name = text.trim();
  d3element.selectAll("text").remove();
  // Force shape shrinkwrap:
  var d = node;
  d.r = d.width = d.height = d.dim = d.rx = d.ry = d.innerRadius = undefined;
  exports.formatText(d3, d3element, node);
};

},{"./drag.js":8,"./selected-color.js":22,"./selected-shape.js":23,"./svg.js":26,"./update.js":31}],29:[function(require,module,exports){
var modCirclesOfCare = require('./circles-of-care.js'),
    modEdgeStyle = require('./edge-style.js'),
    modHelp = require('./help.js'),
    modOptionsMenu = require('./options-menu.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelectedShape = require('./selected-shape.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modUpdate = require('./update.js');

// Edge, shape, and color selection, plus "?" help and Options buttons, load,
// save, and delete.
exports.prepareToolbox = function(d3) {
  modCirclesOfCare.center = null; // CirclesOfCareCenter
  modSystemSupportMap.center = null; // System Support Map Center

  // Handle delete graph
  d3.select("#delete-graph").on("click", function() { modUpdate.deleteGraph(d3, false); });

  modHelp(d3);
  modOptionsMenu.createOptionsMenu(d3);
  modOptionsMenu.createOptionsButton(d3);
  modSelectedColor.createColorPalette(d3);
  modSelectedShape.addShapeSelection(d3);
  modEdgeStyle.addControls(d3);
};

},{"./circles-of-care.js":4,"./edge-style.js":9,"./help.js":19,"./options-menu.js":21,"./selected-color.js":22,"./selected-shape.js":23,"./system-support-map.js":27,"./update.js":31}],30:[function(require,module,exports){
exports.tip = null;

// "Notes" == tooltips
exports.setupNotes = function(d3) {
  exports.tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .style("font-family", "Arial")
    .style("font-weight", "bold")
    .html(function (d) {
      d3.select(".d3-tip")
        .style("display", function() { return d.note ? "block" : "none"; });
      return  d.note || null;
    });
  d3.select("#mainSVG").call(exports.tip);
};

},{}],31:[function(require,module,exports){
var modCirclesOfCare = require('./circles-of-care.js'),
    modDrag = require('./drag.js'),
    modEvents = require('./events.js'),
    modGrid = require('./grid.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelection = require('./selection.js'),
    modSvg = require('./svg.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modText = require('./text.js'),
    modTooltips = require('./tooltips.js'),
    modUtil = require('./util.js');

var addHandle = function(d3, parentG, rectData) {
  var tx = rectData.manualResize ? rectData.width - rectData.xOffset : rectData.width / 2;
  var ty = rectData.manualResize ? rectData.height - rectData.yOffset : rectData.height / 2;
  d3.select(parentG).append("circle")
    .attr("id", "handle" + rectData.id)
    .attr("r", "10")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("transform", "translate(" + tx + "," + ty + ")")
    .style("opacity", 0)
    .style("stroke", "#ff5555")
    .style("fill", "#5555ff")
    .on("mouseover", function() {
      if (d3.event.shiftKey) {
        d3.select(this).style("opacity", 1);
      }
    })
    .on("mousedown", function() {
      if (d3.event.shiftKey) {
        modDrag.clickDragHandle = true;
      }
    })
    .on("mouseup", function() {
      d3.select(this).style("opacity", 0);
    })
    .on("mouseout", function() {
      d3.select(this).style("opacity", 0);
    })
    .call(modDrag.dragHandle);
};

var addNewNodes = function(d3) {
  var newShapeGroups = modSvg.shapeGroups.enter().append("g");

  newShapeGroups.classed("shapeG", true)
    .attr("id", function(d) { return "shapeG" + d.id; })
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    })
    .on("mouseover", function() {
      if (modDrag.shiftNodeDrag) {
        d3.select(this).classed(modEvents.connectClass, true);
      }
    })
    .on("mouseenter", modTooltips.tip.show)
    .on("mouseleave", modTooltips.tip.hide)
    .on("mouseout", function() {
      d3.select(this).classed(modEvents.connectClass, false);
    })
    .on("mousedown", function(d) {
      modEvents.shapeMouseDown(d3, d);
    })
    .on("mouseup", function(d) {
      if (d3.event.ctrlKey && d.url) {
        window.open(d.url, d.name);
        window.event.preventDefault();
        window.event.stopPropagation();
      } else if (d3.event.altKey) {
        var defaultUrl = d.url || "";
        var newUrl = prompt("Enter url for this node: ", defaultUrl);
        if (newUrl) {
          // TODO: make this errorchecking more robust
          if ((newUrl.substring(0, 4) !== "http")
           && (newUrl.substring(0, 4) !== "ftp:")
           && (newUrl.substring(0, 4) !== "file")) {
            newUrl = "http://" + newUrl;
          }
          d.url = newUrl;
          d3.select(this).select("text")
            .style("font-weight", modText.boldFontWeight)
            .style("text-decoration", "underline");
          if (!d.manualResize) {
            // Force shape resize in case bold characters overflow shape boundaries:
            d.r = d.width = d.height = d.dim = d.rx = d.ry = d.innerRadius = undefined;
          }
          exports.updateGraph(d3);
        }
      } else if (d3.event.ctrlKey && d3.event.shiftKey) {
        var defaultNote = d.note || "";
        d.note = prompt("Enter note for this node: ", defaultNote);
        modEvents.lastKeyDown = -1;
      } else {
        modEvents.shapeMouseUp(d3, d3.select(this), d);
      }
    })
    .call(modDrag.drag);
  return newShapeGroups;
};

var addNewPaths = function(d3, edgeGroups) {
  var newPathGroups = edgeGroups.enter().append("g");
  newPathGroups.classed("pathG", true)
    .on("mousedown", function(d) {
      modEvents.pathMouseDown(d3, d3.select(this), d);
    })
    .on("mouseup", function(d) {
      if (d3.event.shiftKey) {
        setEdgeColor(d3, this);
        d3.select(this).selectAll("path")
          .style("stroke-width", function(d) { return d.thickness; });
        var d3txt = modText.changeElementText(d3, d3.select(this), d);
        var txtNode = d3txt.node();
        modText.selectText(txtNode);
        txtNode.focus();
      }
      modEvents.mouseDownLink = null;
    })
    .on("mouseover", function() { // Hover color iff not (selected, new edge or inside shape):
      if ((d3.select(this).selectAll("path").style("stroke") !== modSelectedColor.color)
          && (!modDrag.shiftNodeDrag) && (!modDrag.justDragged)) {
        d3.select(this).selectAll("path").style("stroke", modSelectedColor.hoverColor)
          .style("marker-end", "url(#hover-end-arrow)");
        d3.select(this).selectAll("text").style("fill", modSelectedColor.hoverColor);
      }
    })
    .on("mouseout", function(d) { // If selected go back to selectedColor.
    // Note: "mouseleave", was not getting called in Chrome when the shiftKey is down.
      if (modSelection.selectedEdge && (modSelection.selectedEdge.source === d.source)
        && (modSelection.selectedEdge.target === d.target)) {
        d3.select(this).selectAll("path").style("stroke", modSelectedColor.color);
        d3.select(this).selectAll("text").style("fill", modSelectedColor.color);
      } else { // Not selected: reapply edge color, including edge text:
        setEdgeColor(d3, this);
        d3.select(this).selectAll("text").style("fill", function(d) { return d.color; });
      }
    })
    .append("path")
      .style("marker-end", function(d) {
        var clr = d.color ? d.color.substr(1) : d.target.color.substr(1);
        return "url(#end-arrow" + clr + ")";
      })
      .classed("link", true)
      .style("stroke", function(d) { return d.color || d.target.color; })
      .style("stroke-width", function(d) { return d.thickness || 3; })
      .style("stroke-dasharray", function (d) {
        return (d.style === "dashed") ? "10, 2" : "none";
      });
  newPathGroups.each(function(d) {
    modText.formatText(d3, d3.select(this), d);
  });
  var pathGroups = d3.selectAll(".pathG");
  pathGroups.select("path")
    .attr("d", function(edge) { return setPath(edge); });
  return pathGroups;
};

// Add the newly created shapes to the graph, assigning attributes common to
// all.
var addNewShapes = function(d3, newShapeGroups, shapeElts) {
  newShapeGroups.append(function(d, i) { return shapeElts[i]; })
    .attr("class", function(d) { return "shape " + d.shape; })
    .attr("id", function(d) { return "shape" + d.id; })
    .style("stroke", function(d) { return d.color; })
    .style("stroke-width", function(d) { return (d.shape === "noBorder") ? 0 : 2; });
  newShapeGroups.each(function(d) {
    modText.formatText(d3, d3.select(this), d);
    if (d.shape === "rectangle") {
      addHandle(d3, this, d);
    }
  });
};

// Check to make sure that there aren't already text objects appended (they
// would be pathGroups[0][i].childNodes[1] and [2], where the 0th element is
// expected to be the path) before appending text.
//
// Note that there are two text elements being appended. The first is
// background shadow to ensure that the text is visible where it overlays its
// edge.
var appendPathText = function(d3, pathGroups) {
  var data = [{"class": "shadowText", "stroke-width": "4px"},
              {"class": "foregroundText", "stroke-width": "0px"}];
  for (var i = 0; i < pathGroups[0].length; i++) {         // For each pathGroup...
    if (pathGroups[0][i].childNodes.length < 3) {          // ...if there's no text yet...
      d3.select(pathGroups[0][i]).selectAll("text")
        .data(data)
        .enter().append("text")                        // ...then append it.
          .attr("class", function(d) { return d.class; })
          .attr("text-anchor","middle")
          .text( function(d) { return d.name; })
          .attr("x", function(d) { return (d.source.x + d.target.x) / 2; })
          .attr("y", function(d) { return (d.source.y + d.target.y) / 2; })
          .style("stroke", modSelectedColor.bgColor)
          .style("stroke-width", function(d) { return d.stroke-width; })
          .style("fill", function(d) {
            return d.color;
          });
    }
  }
  d3.selectAll(".pathG").selectAll("text")
    .attr("x", function(d) {
      return (d.source.x + d.target.x) / 2;
    })
    .attr("y", function(d) {
      return (d.source.y + d.target.y) / 2;
    });
};

// Returns new end point p2'. Arg "change" is in pixels. Negative "change"
// shortens the line.
var changeLineLength = function(x1, y1, x2, y2, change, edgeThickness) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  var length = Math.sqrt(dx * dx + dy * dy);
  if (length > 0) {
    dx /= length;
    dy /= length;
  }
  var multiplier = (length + change - 4 * (edgeThickness - 3)); // Thicker -> longer
  dx *= multiplier;
  dy *= multiplier;
  return {"x": x1 + dx, "y": y1 + dy};
};

// Create the new shapes, but don't add them yet.
var createNewShapes = function()  {
  var shapeElts = [];
  var shape;
  for (var i = 0; i < modSvg.nodes.length; i++) {
    switch (modSvg.nodes[i].shape) {
    case "rectangle":
    case "noBorder":
      shape = "rect";
      break;
    case "diamond":
      shape = "path";
      break;
    case "star":
      shape = "polygon";
      break;
    default: // circle and ellipse
      shape = modSvg.nodes[i].shape;
      break;
    }
    var shapeElement = document.createElementNS("http://www.w3.org/2000/svg", shape);
    shapeElts.push(shapeElement);
  }
  return shapeElts;
};

var setEdgeColor = function(d3, edgeGroup) {
  d3.select(edgeGroup).selectAll("path")
    .style("stroke", function(d) { return d.color; })
    .style("marker-end", function(d) {
      return "url(#end-arrow" + d.color.substr(1) + ")";
    });
};

var setPath = function(edge) {
  var boundary = 16; // Initialize to default number of pixels padding for circle, diamond.
  switch (edge.target.shape) {
    case "circle":
      if (edge.target.r) {
        boundary += parseFloat(edge.target.r);
      } else {
        boundary = edge.target.boundary;
      }
      break;
    case ("rectangle"):
    case ("noBorder"):
      boundary = modUtil.computeRectangleBoundary(edge);
      break;
    case "diamond":
      if (edge.target.dim) {
        boundary += (parseFloat(edge.target.dim) / 2);
      } else {
        boundary = edge.target.boundary;
      }
      break;
    case "ellipse":
      boundary = modUtil.computeEllipseBoundary(edge);
      break;
    case "star":
      boundary = edge.target.boundary;
      break;
    default:
      alert("setPath(...): unknown shape: \"" + edge.target.shape + "\"");
      break;
  }
  var newP2 = changeLineLength(edge.source.x, edge.source.y, edge.target.x, edge.target.y,
                                   -boundary, (edge.thickness || 3));
  return "M" + edge.source.x + "," + edge.source.y + "L" + newP2.x + "," + newP2.y;
};

var updateExistingNodes = function() {
  modSvg.shapeGroups = modSvg.shapeGroups.data(modSvg.nodes, function(d) {
    return d.id;
  });
  modSvg.shapeGroups.attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
};

exports.deleteGraph = function(d3, skipPrompt) {
  var doDelete = true;
  if (!skipPrompt) {
    doDelete = window.confirm("Press OK to delete this graph from the canvas. (It will still be saved on the server.)");
  }
  if(doDelete) {
    modSvg.nodes = [];
    modSvg.links = [];
    modCirclesOfCare.hide(d3);
    modSystemSupportMap.show(d3);
    exports.updateGraph(d3);
    window.location.hash = "";
  }
};

exports.updateExistingPaths = function() {
  modSvg.edgeGroups = modSvg.edgeGroups.data(modSvg.links, function(d) {
    return String(d.source.id) + "+" + String(d.target.id);
  });
  modSvg.edgeGroups.classed(modSelection.selectedClass, function(d) {
    return d === modSelection.selectedEdge;
  })
    .attr("d",  function(d) {
      return setPath(d);
    })
    .select('path')
    .style('stroke', function(d){return d.color;})
    .style('fill',   function(d){return d.color;});
  modSvg.edgeGroups
    .select('text')
    .style('stroke', function(d){return d.color;})
    .style('fill',   function(d){return d.color;});
  return modSvg.edgeGroups;
};

// Call to propagate changes to graph
exports.updateGraph = function(d3) {
  updateExistingNodes();
  var newShapeGroups = addNewNodes(d3);
  var shapeElts = createNewShapes();
  addNewShapes(d3, newShapeGroups, shapeElts);
  modSvg.shapeGroups.exit().remove(); // Remove old nodes
  if (modSvg.shapeGroups) {
    modSvg.shapeGroups.each(function(d) {
      if (d.manualResize) {
        var remove = d3.select(this).remove();
        d3.select("#manResizeGG").append(function() {
          return remove.node();
        });
      }
    });
  }
  var edgeGroups = exports.updateExistingPaths();
  var newPathGroups = addNewPaths(d3, edgeGroups);
  appendPathText(d3, newPathGroups);
  edgeGroups.exit().remove(); // Remove old links
};

exports.updateWindow = function(d3) {
  var wizardEl = document.getElementById('wizard'),
      width = window.innerWidth,
      height = window.innerHeight - wizardEl.clientHeight;
  modSvg.svg.attr('width', width).attr('height', height);
  modGrid.create(d3);
  exports.updateGraph(d3);
};

},{"./circles-of-care.js":4,"./drag.js":8,"./events.js":12,"./grid.js":18,"./selected-color.js":22,"./selection.js":24,"./svg.js":26,"./system-support-map.js":27,"./text.js":28,"./tooltips.js":30,"./util.js":32}],32:[function(require,module,exports){
var cookiesByName = null;

exports.readCookieByName = function(name) {
  if (cookiesByName) { return cookiesByName[name]; }
  if (!document.cookie) { return undefined; }
  // `document.cookie` is a string like so:
  // "auth_token=bfb35669-04f7-4f25-8876-c482dd8580bc; user_id=1"
  var strs = document.cookie.split('; ');
  cookiesByName = {};
  for (var i=0; i<strs.length; i++) {
    var vals = strs[i].split('=');
    cookiesByName[vals[0]] = vals[1];
  }
  return cookiesByName[name];
};

// http://warpycode.wordpress.com/2011/01/21/calculating-the-distance-to-the-edge-of-an-ellipse/
// Angle theta is measured from the -y axis (recalling that +y is down)
// clockwise.
exports.computeEllipseBoundary = function(edge) {
  var dx = edge.target.x - edge.source.x;
  var dy = edge.target.y - edge.source.y;
  var rx  = edge.target.rx,
      ry  = edge.target.ry;
  var h = Math.sqrt(dx * dx + dy * dy);
  var s = dx / h; // sin theta
  var c = dy / h; // cos theta
  var length = Math.sqrt(1 / ((s / rx) * (s / rx) + (c / ry) * (c / ry)));
  var offset = 18;
  return length + offset;
};

// Angle theta is measured from -y axis (up) clockwise.
exports.computeRectangleBoundary = function(edge) {
  var dx = Math.abs(edge.source.x - edge.target.x);
  var dy = Math.abs(edge.target.y - edge.source.y);
  var hyp = Math.sqrt(dx * dx + dy * dy);
  var absCosTheta = dy / hyp; // Absolute value of cosine theta
  var w = edge.target.width / 2;
  var h = edge.target.height / 2;
  var thresholdCos = h / Math.sqrt(w * w + h * h); // cos of angle where intersect switches sides
  var offset = 22; // Give the arrow a little breathing room
  return ((absCosTheta > thresholdCos) ? h * hyp / dy : w * hyp / dx) + offset;
};

},{}],33:[function(require,module,exports){
var modArrayUtils = require('./array-utils.js'),
    modCompletions = require('./completions.js'),
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

var numSteps = 11;
var nodesByType = {
      'role': null,
      'responsibility': [],
      'need': [],
      'resource': [],
      'wish': []
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

var updateNode = function(d3, type, indexAmongType, parent_s, text, edgeColor) {
  var node = nodesByType[type][indexAmongType],
      parents = [].concat(parent_s),
      parentGroups = modArrayUtils.venn(d3, node.__parents__, parents,
                                        function(d){ return d.name; }),
      newEdge = function(src) { return {
        source: src,
        target: node,
        style: 'solid',
        color: edgeColor || 'black',
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

  var newNode = upsertNode(d3, 'resource', resourceNumber, parents,
                           type.node().value, edgeColor),
      nameNode = name.node(),
      hdNode = helpDescrip.node();

  newNode.helpfulness = helpfulness;
  if (nameNode) {
    newNode.specific_name = nameNode.value;
  } else {
    delete newNode.specific_name;
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
  var root = d3.select('#wizard-step10'),
      name = root.select('input[name=wish_name]').property('value'),
      parentTypeSel = root.select('input[name=wish_parent_type]:checked'),
      parentType = parentTypeSel.size() ?
        parentTypeSel.property('value') : null,
      selectNode = root.select('select').node(),
      // subtract 1 because of the empty first option
      parentIdx = selectNode && selectNode.selectedIndex - 1,
      parentNode = parentIdx ? nodesByType[parentType][parentIdx] : null,
      descrip = root.select('textarea').property('value');

  d3.select('#wizard-wish-name-error')
    .text(name ? '' : 'Please enter a wish name.');
  d3.select('#wizard-wish-parent-type-error')
    .text(parentType ? '' : 'Please make a selection.');
  d3.select('#wizard-wish-parent-node-error')
    .text(parentNode ? '' : 'Please make a selection.');
  if (!name || !parentType || !parentNode) return false;

  var newNode = upsertNode(d3, 'wish', wishNumber, parentNode, name);
  newNode.resourceDescription = descrip;
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
  d3.selectAll('#wizard-step8 input[name=helpfulness]:checked')
    .property('checked', false);
  d3.select('#wizard-step8 textarea').property('value', '');
};

var populateResourceForm = function(d3, resource) {
  d3.select('#wizard-step8 input[name=resource_type]')
    .property('value', resource.name);
  d3.select('#wizard-step8 input[name=resource_name]')
    .property('value', resource.specific_name);
  d3.select('#wizard-resource-needs')
    .selectAll('div.wizard-need-group')
    .selectAll('label')
    .select('input')
    .property('checked', function(d,i,j){
      return resource.__parents__.indexOf(d) !== -1;
    });
  d3.select('#wizard-step8 input[name=helpfulness][value="' +
            resource.helpfulness + '"]')
    .property('checked', true);
  d3.select('#wizard-step8 textarea')
    .property('value', resource.helpfulnessDescription);
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
  labels.append('br');
  d3.select('#resource-type-completions')
    .selectAll('option')
    .data(modCompletions.completionsByType.resource)
    .enter().append('option')
    .attr('value', String);
  if (resourceNum < nodesByType.resource.length) {
    populateResourceForm(d3, nodesByType.resource[resourceNum]);
  }
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

var setupWishFormParentList = function(d3, parentType) {
  d3.select('#wizard-step10 span.wish-parent-type').text(parentType);
  d3.select('#wizard-step10 div.wish-parent-selection')
    .style('display', 'block');
  d3.select('div.wish-parent-list').selectAll('*').remove();
  var select = d3.select('#wizard-step10 div.wish-parent-list')
        .append('select')
        .attr('name', 'wish_parent_node_index');
  var options = select.selectAll('option')
        .data([null].concat(nodesByType[parentType]))
        .enter().append('option')
        .attr('value', function(d,i){ return d ? i : null; })
        .text(function(d){ return d ? d.name : ''; });
  d3.select('#wizard-step10 div.wish-resource-description')
    .style('display', parentType === 'resource' ? 'block' : 'none');
};

var setupWishForm = function(d3, wishNum) {
  var root = d3.select('#wizard-step10');
  root.select('span.wish-number').text(wishNum + 1);
  root.select('input[name=wish_name]').property('value', '');
  root.select('textarea').property('value', '');
  root.select('div.wish-parent-list').selectAll('*').remove();
  root.selectAll('input[name=wish_parent_type]')
    .property('checked', false)
    .on('click', function(){
      setupWishFormParentList(d3, d3.select(this).property('value'));
    });
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

  9: { isMinimized: true },

  10: {
    currentWish: null,

    enter: function(d3, direction) {
      this.currentWish = direction === 1 ? 0
        : Math.max(0, nodesByType.wish.length - 1);
      setupWishForm(d3, this.currentWish);
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

},{"./array-utils.js":1,"./completions.js":5,"./database.js":7,"./entry-list.js":11,"./events.js":12,"./selection.js":24,"./svg.js":26,"./system-support-map.js":27,"./text.js":28,"./update.js":31}],34:[function(require,module,exports){
var modGrid = require('./grid.js'),
    modGridZoom = require('./grid-zoom.js'),
    modText = require('./text.js');

exports.zoomSvg = null;
exports.justScaleTransGraph = false;

var zoomed = function(d3) {
  exports.justScaleTransGraph = true;
  modGridZoom.zoom = d3.event.scale;
  modGridZoom.translate = d3.event.translate;
  d3.select(".graph")
    .attr("transform", "translate(" + modGridZoom.translate + ") scale(" + modGridZoom.zoom + ")");
  modGrid.create(d3);
};

exports.setup = function(d3, svg) {
  exports.zoomSvg = d3.behavior.zoom()
    .on("zoom", function() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.shiftKey) {
        // TODO  the internal d3 state is still changing
        return false;
      } else {
        zoomed(d3);
      }
      return true;
    })
    .on("zoomstart", function() {
      var ael = d3.select("#" + modText.activeEditId).node();
      if (ael) {
        ael.blur();
      }
      if (!d3.event.sourceEvent || !d3.event.sourceEvent.shiftKey) {
        d3.select("body").style("cursor", "move");
      }
    })
    .on("zoomend", function() {
      d3.select("body").style("cursor", "auto");
    });
  svg.call(exports.zoomSvg).on("dblclick.zoom", null);
};

},{"./grid-zoom.js":17,"./grid.js":18,"./text.js":28}]},{},[20]);
