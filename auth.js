
// Check whether we're authenticated at the backend, and call the callback
// with the boolean result (i.e. true = authenticated, false = not).
var checkAuthentication = function(d3, callback) {
  d3.xhr(this.consts.backendBase + '/testauth')
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
    .html('<label>' +
          '  Email address:' +
          '  <input type="text" name="email" />' +
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
          '<input type="submit" name="Login" />');

  // JST 2015-08-23 - Stop propagation of keydown events, so that the
  // handlers elsewhere in this code don't prevent default. I needed to do
  // this to allow users to hit 'backspace' in these fields.
  form.selectAll('input[type=text]')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });
  form.selectAll('input[type=password]')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });

  var graph = this;
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
    if (d3.event.target[1].value != d3.event.target[2].value) {
      d3.select('#authentication p.message')
        .text("Passwords don't match. Try again.");
    } else {
      d3.select('#authentication p.message').text('Loading...');
      var requestData = {
        email   : d3.event.target[0].value,
        password: d3.event.target[1].value
      };
      d3.xhr(graph.consts.backendBase + '/register')
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
  var header = content
    .append('h1')
    .text('You must log in first:');
  var form = content
    .append('form')
    .attr("id", "login")
    .html('<label>' +
          '  Email address:' +
          '</label>' +
          '  <input type="text" name="email" />' +
          '<br />' +
          '<label>' +
          '  Password:' +
          '</label>' +
          '  <input type="password" name="password" />' +
          '<br />' +
          '<input type="submit" name="Log in" />');

  // JST 2015-08-23 - Stop propagation of keydown events, so that the
  // handlers elsewhere in this code don't prevent default. I needed to do
  // this to allow users to hit 'backspace' in these fields.
  form.selectAll('input[type=text]')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });
  form.selectAll('input[type=password]')
    .on('keydown', function(elt) { d3.event.stopPropagation(); });

  var graph = this;
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
    d3.xhr(graph.consts.backendBase + '/login')
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
  d3.xhr(this.consts.backendBase + '/logout')
    .on('beforesend', function(request) { request.withCredentials = true; })
    .get(function(error, data) {
      if (error) {
        console.log('Logout error:', error);
        alert('Error logging out.');
      } else {
        alert("You have logged out from SSM.");
      }
    });
}
