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
