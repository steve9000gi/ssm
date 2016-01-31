var modUpdate = require('./update.js');

exports.showWizard = function(d3) {
  document.getElementById('wizard').className = 'open';
  modUpdate.updateWindow(d3);
};

exports.hideWizard = function(d3) {
  document.getElementById('wizard').className = 'closed';
  modUpdate.updateWindow(d3);
};
