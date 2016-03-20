(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./backend.js":2}],2:[function(require,module,exports){
exports.backendBase = 'http://syssci.renci.org:8080';

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{"./events.js":9,"./selected-color.js":19,"./selection.js":21,"./text.js":25,"./update.js":28}],5:[function(require,module,exports){
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
// an integer, try to load the map from the server.
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
};

exports.setupWriteMapToDatabase = function(d3) {
  d3.select("#write-to-db").on("click", function() {
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
            alert('Saved map #' + id + '.');
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
            var text = 'Saved new map #' + data.id + ' with default name. ' +
                  'To change the name, click the "Read map from database" ' +
                  'button in the toolbox, then click "Rename".';
            alert(text);
            window.location.hash = '/map/' + data.id;
          })
          .send('POST', JSON.stringify(modSerialize.getMapObject(d3)));
      }
    });
  });
};

},{"./auth.js":1,"./backend.js":2,"./circles-of-care.js":3,"./serialize.js":22,"./system-support-map.js":24,"./util.js":29}],6:[function(require,module,exports){
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

},{"./grid.js":15,"./svg.js":23,"./update.js":28}],7:[function(require,module,exports){
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

},{"./edge-thickness.js":8,"./selected-color.js":19,"./selected-shape.js":20}],8:[function(require,module,exports){
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

},{"./selected-color.js":19}],9:[function(require,module,exports){
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

},{"./drag.js":6,"./edge-style.js":7,"./edge-thickness.js":8,"./selected-color.js":19,"./selected-shape.js":20,"./selection.js":21,"./svg.js":23,"./text.js":25,"./update.js":28,"./zoom.js":31}],10:[function(require,module,exports){
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

},{"./circles-of-care.js":3,"./selected-color.js":19,"./system-support-map.js":24,"./text.js":25,"./update.js":28}],11:[function(require,module,exports){
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

},{"./serialize.js":22}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"./circles-of-care.js":3,"./context-menu.js":4,"./database.js":5,"./drag.js":6,"./events.js":9,"./file.js":11,"./front-matter.js":12,"./options-menu.js":18,"./selected-color.js":19,"./svg.js":23,"./system-support-map.js":24,"./toolbox.js":26,"./tooltips.js":27,"./zoom.js":31}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{"./grid-zoom.js":14}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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
    modDatabase.loadMapFromLocation(d3);
    modWizard.showWizard(d3);
    window.showWizard = function() { modWizard.showWizard(d3); };
    window.hideWizard = function() { modWizard.hideWizard(d3); };
  });
})(window.d3);

},{"./auth.js":1,"./database.js":5,"./events.js":9,"./graph.js":13,"./svg.js":23,"./update.js":28,"./wizard.js":30}],18:[function(require,module,exports){
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

},{"./auth.js":1,"./circles-of-care.js":3,"./context-menu.js":4,"./edge-thickness.js":8,"./export.js":10,"./grid.js":15,"./selected-color.js":19,"./selected-shape.js":20,"./selection.js":21,"./system-support-map.js":24,"./text.js":25,"./update.js":28}],19:[function(require,module,exports){
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

},{"./edge-style.js":7,"./selected-shape.js":20}],20:[function(require,module,exports){
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

},{"./selected-color.js":19,"./svg.js":23,"./update.js":28}],21:[function(require,module,exports){
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

},{"./selected-color.js":19,"./selection.js":21,"./svg.js":23}],22:[function(require,module,exports){
var modCirclesOfCare = require('./circles-of-care.js'),
    modEvents = require('./events.js'),
    modGridZoom = require('./grid-zoom.js'),
    modSvg = require('./svg.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modUpdate = require('./update.js'),
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

// Return the current map as an JS object.
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
  return {
    "nodes": modSvg.nodes,
    "links": saveEdges,
    "graphGTransform": d3.select("#graphG").attr("transform"),
    "systemSupportMapCenter": modSystemSupportMap.center,
    "circlesOfCareCenter": modCirclesOfCare.center
  };
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
  } catch(err) {
    window.alert("Error parsing uploaded file\nerror message: " + err.message);
    return;
  }
};

},{"./circles-of-care.js":3,"./events.js":9,"./grid-zoom.js":14,"./svg.js":23,"./system-support-map.js":24,"./update.js":28,"./zoom.js":31}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
var modSelectedColor = require('./selected-color.js');

exports.hideText = "Hide system support rings";
exports.center = null;
exports.visible = true;
exports.ringRadii = [110, 275, 475, 675];

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

},{"./selected-color.js":19}],25:[function(require,module,exports){
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

// FIXME: seems to be unused anywhere.
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

},{"./drag.js":6,"./selected-color.js":19,"./selected-shape.js":20,"./svg.js":23,"./update.js":28}],26:[function(require,module,exports){
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

},{"./circles-of-care.js":3,"./edge-style.js":7,"./help.js":16,"./options-menu.js":18,"./selected-color.js":19,"./selected-shape.js":20,"./system-support-map.js":24,"./update.js":28}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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
    });
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

},{"./circles-of-care.js":3,"./drag.js":6,"./events.js":9,"./grid.js":15,"./selected-color.js":19,"./selection.js":21,"./svg.js":23,"./system-support-map.js":24,"./text.js":25,"./tooltips.js":27,"./util.js":29}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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
  nodesByType.role = node;
  node.fixed = 1;
  exports.nextStep(d3);
};

var addResponsibility = function(d3) {
  var inputEl = d3.select('input[name=responsibility]').node(),
      text = inputEl.value,
      numResponsibilities = nodesByType.responsibility.length,
      newNode,
      center = modSystemSupportMap.center,
      ringRadii = modSystemSupportMap.ringRadii,
      distanceFromCenter = (ringRadii[0] + ringRadii[1]) / 2,
      dx, dy, x, y;

  inputEl.value = '';
  if (numResponsibilities < 2) {
    // first responsibility goes right of center, second goes left
    dx = distanceFromCenter;
    x = numResponsibilities == 0 ? center.x + dx : center.x - dx;
    y = center.y;
    newNode = modEvents.addNode(d3, x, y, text);
  } else {
    var positions = [];
    numResponsibilities++;
    for (var i=1; i < numResponsibilities; i++) {
      var theta = -i * 2 * Math.PI / numResponsibilities;
      dx = distanceFromCenter * Math.cos(theta);
      dy = distanceFromCenter * Math.sin(theta);
      x = center.x + dx;
      y = center.y - dy; // remember that y is inverted in SVG
      if (i == numResponsibilities - 1) {
        newNode = modEvents.addNode(d3, x, y, text);
      } else {
        var node = nodesByType.responsibility[i];
        node.x = x;
        node.y = y;
      }
    }
  }

  var edge = {
    source: nodesByType.role,
    target: newNode,
    style: 'solid',
    color: '#000000',
    thickness: 3,
    name: ''
  };
  modEvents.addEdge(d3, edge);
  newNode.type = 'responsibility';
  newNode.parent = nodesByType.role;
  nodesByType.responsibility.push(newNode);
};

var addNeed = function(d3) {
  var inputEl = d3.select('input[name=need]').node(),
      text = inputEl.value,
      parentResponsibility = nodesByType.responsibility[curResponsibility],
      numNeeds = nodesByType.need.length,
      newNode,
      center = modSystemSupportMap.center,
      ringRadii = modSystemSupportMap.ringRadii,
      distanceFromCenter = (ringRadii[1] + ringRadii[2]) / 2,
      dx, dy, x, y;

  inputEl.value = '';
  if (!numNeeds) {
    // if no siblings yet, just drop it at theta = 0.
    dx = distanceFromCenter;
    x = numNeeds == 0 ? center.x + dx : center.x - dx;
    y = center.y;
    newNode = modEvents.addNode(d3, x, y, text);
  } else {

    var prevNeed = nodesByType.need[numNeeds - 1],
        theta;
    if (prevNeed.parent === parentResponsibility) {
      // drop it at theta of last need plus a bit and force-layout.
      var oldTheta = Math.atan2(prevNeed.y - center.y, prevNeed.x - center.x);
      // FIXME: at some point we'll have to be more careful not to overlap. e.g.
      // what if there are like 100 nodes in this ring already?
      theta = Math.min(Math.PI * 31.9 / 32, oldTheta + Math.PI / 160);
    } else {
      theta = Math.atan2(parentResponsibility.y - center.y, parentResponsibility.x - center.x);
    }
    dx = distanceFromCenter * Math.cos(theta);
    dy = distanceFromCenter * Math.sin(theta);
    x = center.x + dx;
    y = center.y + dy;
    newNode = modEvents.addNode(d3, x, y, text);
  }

  var edge = {
    source: parentResponsibility,
    target: newNode,
    style: 'solid',
    color: '#000000',
    thickness: 3,
    name: ''
  };
  modEvents.addEdge(d3, edge);
  newNode.type = 'need';
  newNode.parent = parentResponsibility;
  nodesByType.need.push(newNode);
  forceLayout.start();
};

var tickForceLayout = function(d3) {
  var nodes = forceLayout.nodes(),
      q = d3.geom.quadtree(nodes),
      n = nodes.length,
      i;
  for (i = 1; i < n; i++) {
    q.visit(collideWithNeighborNodes(nodes[i]));
  }
  for (i = 1; i < n; i++) {
    attract(nodes[i]);
  }
  for (i = 1; i < n; i++) {
    collideWithRingBoundary(nodes[i]);
  }
  if (drawForceLayoutTransition) {
    updatePositions(d3);
  }
};

var collideWithNeighborNodes = function(node1) {
  var nr = +node1.r + 16,
      nx1 = node1.x - nr,
      nx2 = node1.x + nr,
      ny1 = node1.y - nr,
      ny2 = node1.y + nr;

  return function(quad, x1, y1, x2, y2) {
    var node2 = quad.point;
    if (node2 && (node2 !== node1)) {
      var dx = node1.x - node2.x,
          dy = node1.y - node2.y,
          dist = Math.sqrt(dx * dx + dy * dy),
          mindist = +node1.r + +node2.r,
          overlap = mindist - dist;

      if (overlap > 0) {
        var halfOverlapProportion = overlap / dist * 0.5,
            xOffset = dx * halfOverlapProportion,
            yOffset = dy * halfOverlapProportion;

        node1.x += xOffset;
        node1.y += yOffset;
        // Nullify momentum to prevent bouncing.
        node1.px = node1.x;
        node1.py = node1.y;

        node2.x -= xOffset;
        node2.y -= yOffset;
        node2.px = node2.x;
        node2.py = node2.y;
      }
    }

    return x1 > nx2
      || x2 < nx1
      || y1 > ny2
      || y2 < ny1;
  };
};

var attract = function(node) {
  if (!node.parent) { return; }
  var parent = node.parent,
      center = modSystemSupportMap.center,
      dx = node.type === 'responsibility' ? node.x - center.x : parent.x - center.x,
      dy = node.type === 'responsibility' ? node.y - center.y : parent.y - center.y,
      ringRadii = modSystemSupportMap.ringRadii,
      ringNum = node.type === 'responsibility' ? 1 :
                node.type === 'need' ? 2 :
                node.type === 'resource' ? 3 : null,
      innerRingRadius = ringRadii[ringNum - 1],
      outerRingRadius = ringRadii[ringNum],
      targetRadius = (innerRingRadius + outerRingRadius) / 2,
      theta = Math.atan2(dy, dx),
      targetX = targetRadius * Math.cos(theta) + center.x,
      targetY = targetRadius * Math.sin(theta) + center.y,
      dirDx = targetX - node.x,
      dirDy = targetY - node.y,
      dirTheta = Math.atan2(dirDy, dirDx),
      maxMagnitude = Math.sqrt(dirDx * dirDx + dirDy * dirDy),
      moveMagnitude = Math.min(maxMagnitude, forceLayout.alpha() * 20),
      moveX = moveMagnitude * Math.cos(dirTheta),
      moveY = moveMagnitude * Math.sin(dirTheta);
  node.x += moveX;
  node.y += moveY;
};

// ring 0 is "bullseye", i.e. innermost circle
var collideWithRingBoundary = function(node) {
  var center = modSystemSupportMap.center,
      dx = node.x - center.x,
      dy = node.y - center.y,
      ringRadii = modSystemSupportMap.ringRadii,
      ringNum = node.type === 'responsibility' ? 1 :
        node.type === 'need' ? 2 :
        node.type === 'resource' ? 3 : null,
      innerRingRadius = ringRadii[ringNum - 1],
      outerRingRadius = ringRadii[ringNum],
      distFromCenter = Math.sqrt(dx * dx + dy * dy),
      r = +node.r, // TODO: what if the node isn't a circle?
      theta = Math.atan2(dy, dx),
      overlap;

  // TODO: think about whether this also covers the case of the center being
  // entirely outside the allowed ring.
  if (distFromCenter - r < innerRingRadius) {
    // push out from inner ring
    overlap = innerRingRadius - distFromCenter + r;
    // TODO: think about whether sign is correct here in all 4 quadrants (and below)
    node.x += overlap * Math.cos(theta);
    node.y += overlap * Math.sin(theta);
  } else if (distFromCenter + r > outerRingRadius) {
    // push in from outer ring
    overlap = distFromCenter - outerRingRadius + r;
    node.x -= overlap * Math.cos(theta);
    node.y -= overlap * Math.sin(theta);
  }
};

var addResource = function(d3) {
  // TODO: DRY up with addNeed()
  var inputEl = d3.select('input[name=resource]').node(),
      text = inputEl.value,
      helpfulness = d3.select('input[name=helpfulness]:checked').node().value,
      parentNeed = nodesByType.need[curNeed],
      numResources = nodesByType.resource.length,
      newNode,
      center = modSystemSupportMap.center,
      ringRadii = modSystemSupportMap.ringRadii,
      distanceFromCenter = (ringRadii[1] + ringRadii[2]) / 2,
      dx, dy, x, y;

  inputEl.value = '';
  d3.selectAll('input[name=helpfulness]').property('checked', false);
  if (!numResources) {
    // if no siblings yet, just drop it at theta = 0.
    dx = distanceFromCenter;
    x = numResources == 0 ? center.x + dx : center.x - dx;
    y = center.y;
    newNode = modEvents.addNode(d3, x, y, text);
  } else {

    var prevResource = nodesByType.resource[numResources - 1],
        theta;
    if (prevResource.parent === parentNeed) {
      // drop it at theta of last resource plus a bit and force-layout.
      var oldTheta = Math.atan2(prevResource.y - center.y, prevResource.x - center.x);
      // FIXME: at some point we'll have to be more careful not to overlap. e.g.
      // what if there are like 100 nodes in this ring already?
      theta = Math.min(Math.PI * 31.9 / 32, oldTheta + Math.PI / 160);
    } else {
      theta = Math.atan2(parentNeed.y - center.y, parentNeed.x - center.x);
    }
    dx = distanceFromCenter * Math.cos(theta);
    dy = distanceFromCenter * Math.sin(theta);
    x = center.x + dx;
    y = center.y + dy;
    newNode = modEvents.addNode(d3, x, y, text);
  }

  var edge = {
    source: parentNeed,
    target: newNode,
    style: 'solid',
    color: '#000000',
    thickness: 3,
    name: ''
  };
  modEvents.addEdge(d3, edge);
  newNode.type = 'resource';
  newNode.parent = parentNeed;
  console.log('helpfulness: ' + helpfulness);
  newNode.helpfulness = helpfulness;
  nodesByType.resource.push(newNode);
  forceLayout.start();
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

var updatePositions = function(d3) {
  modSvg.shapeGroups
    .attr('transform', function(d,i) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  modUpdate.updateGraph(d3);
};

var setupForceLayout = function(d3) {
  var w = modSvg.width,
      h = modSvg.height,
      nodes = modSvg.nodes;
  forceLayout = d3.layout.force()
    .gravity(0)
    .charge(-30)
    .nodes(nodes)
    .size([w, h]);
  forceLayout.on("tick",  function() { tickForceLayout(d3); });
  forceLayout.on("end",  function() { updatePositions(d3); });
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

exports.showWizard = function(d3) {
  document.getElementById('wizard').className = 'open';
  exports.showStep(d3);
  modUpdate.updateWindow(d3);
  setupForceLayout(d3);
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

},{"./events.js":9,"./selection.js":21,"./svg.js":23,"./system-support-map.js":24,"./text.js":25,"./update.js":28}],31:[function(require,module,exports){
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

},{"./grid-zoom.js":14,"./grid.js":15,"./text.js":25}]},{},[17]);
