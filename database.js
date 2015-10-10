var modAuth = require('./auth.js'),
    modCirclesOfCare = require('./circles-of-care.js');

// Fetch a map from the backend given its id
var fetchMap = function(d3, id) {
  var thisGraph = this;
  d3.json(this.consts.backendBase + '/map/' + id)
    .on('beforesend', function(request) { request.withCredentials = true; })
    .on('error',
        function() { window.alert('Error talking to backend server.'); })
    .on('load', function(data) {
      d3.select('#map-index').style('visibility', 'hidden');
      thisGraph.importMap(data.document, id);
      window.location.hash = '/map/' + id;
    })
    .send('GET');
};

var renderMapsList = function(d3, data) {
  d3.selectAll('#map-index .content *').remove();
  if (!data || data.length === 0) {
    d3.select('#map-index .content').append('p')
      .text("You're logged in, but you don't have any maps yet. " +
            "To get started, create a map and click the 'save' button.");
    return;
  }

  var asAdmin = data && data[0] && data[0].hasOwnProperty('owner_email');
  var columns =
    ['Map ID', 'Created At', 'Modified At', 'Num. Nodes', 'Num. Links'];
  if (asAdmin) {
    columns.push('Owner Email');
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
  rows.append('td').text(function(d) { return d.created_at; });
  rows.append('td').text(function(d) { return d.modified_at; });
  rows.append('td').text(function(d) { return d.num_nodes; });
  rows.append('td').text(function(d) { return d.num_links; });
  if (asAdmin) {
    rows.append('td').text(function(d) { return d.owner_email; });
  }
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
  d3.json(this.consts.backendBase + '/maps')
    .on('beforesend', function(request) { request.withCredentials = true; })
    .on('error',
        function(error) { window.alert('Error talking to backend server.'); })
    .on('load', function(result) { renderMapsList(d3, result); })
    .send('GET');
};

// Return the current map as an JS object.
var getMapObject = function(d3) {
  var saveEdges = [];
  this.links.forEach(function(val) {
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
    "nodes": this.nodes,
    "links": saveEdges,
    "graphGTransform": d3.select("#graphG").attr("transform"),
    "systemSupportMapCenter": this.SSMCenter,
    "circlesOfCareCenter": modCirclesOfCare.center
  };
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
    var thisGraph = this;
    d3.json(this.consts.backendBase + '/map/' + id)
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
        thisGraph.importMap(data.document, id);
        window.location.hash = '/map/' + id;
      })
      .send('GET');
  }
};

exports.setupWriteMapToDatabase = function(d3) {
  var graph = this;
  d3.select("#write-to-db").on("click", function() {
    modAuth.afterAuthentication(d3, function() {
      var m  = window.location.hash.match(/\/map\/(\d+)/);
      if (m) {
        // update existing map
        var id = m[1];
        d3.xhr(graph.consts.backendBase + '/map/' + id)
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
            console.log('saved map # ' + id);
          })
          .send('PUT', JSON.stringify(getMapObject(d3)));

      } else {
        // create new map
        d3.xhr(graph.consts.backendBase + '/map')
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
            console.log('saved new map # ' + data.id);
            window.location.hash = '/map/' + data.id;
          })
          .send('POST', JSON.stringify(getMapObject(d3)));
      }
    });
  });
};
