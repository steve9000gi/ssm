var modUpdate = require('./update.js');
var modSerialize = require('./serialize.js');

exports.showNodeTextText = "Show node text";
exports.showingCodes = false;
exports.uploadFile = null;
exports.txtRes = null;

var reloadMap = function(d3) {
 if (window.File && window.FileReader && window.FileList && window.Blob) {
    var filereader = new window.FileReader();

    filereader.onload = function() {
      try {
	exports.txtRes = filereader.result;
      } catch(err) {
	window.alert("reloadMap: error reading file: " + err.message);
      }
      return modSerialize.importMap(d3, JSON.parse(modShowCodes.txtRes));
    };
    filereader.readAsText(exports.uploadFile);
  } else {
    alert("Your browser won't let you read this file -- try upgrading your "
        + "browser to IE 10+ or Chrome or Firefox.");
  }
}

exports.showCodes = function(d3) {
  d3.select("#showCodesItem").text(exports.showNodeTextText)
    .datum({"name": exports.showNodeTextText});
  if (exports.txtRes) {
    reloadMap(d3);
  }
  exports.showingCodes = true;
};

exports.showNodeText = function(d3) {
  d3.select("#showCodesItem").text("Show codes")
    .datum({"name": "Show codes"});
  if (exports.txtRes) {
    reloadMap(d3);
  }
  exports.showingCodes = false;
};
