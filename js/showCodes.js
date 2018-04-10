var modUpdate = require('./update.js');

exports.showNodeTextText = "Show node text";
exports.showingCodes = false;

exports.showCodes = function(d3) {
  d3.select("#showCodesItem").text(exports.showNodeTextText)
    .datum({"name": exports.showNodeTextText});
  modUpdate.updateGraph(d3);
  exports.showingCodes = true;
};

exports.showNodeText = function(d3) {
  d3.select("#showCodesItem").text("Show codes")
    .datum({"name": "Show codes"});
  modUpdate.updateGraph(d3);
  exports.showingCodes = false;
};
