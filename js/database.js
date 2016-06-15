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
