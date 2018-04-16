var modSerialize = require('./serialize.js');
var modShowCodes = require('./showCodes.js');


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
      modShowCodes.uploadFile = this.files[0];
      var filereader = new window.FileReader();
      var txtRes;

      filereader.onload = function() {
        try {
          modShowCodes.txtRes = filereader.result;
        } catch(err) {
          window.alert("setupUpload: error reading file: " + err.message);
        }
        return modSerialize.importMap(d3, JSON.parse(modShowCodes.txtRes));
      };
      filereader.readAsText(modShowCodes.uploadFile);
    } else {
      alert("Your browser won't let you read this file -- try upgrading your browser to IE 10+ "
            + "or Chrome or Firefox.");
    }
  });
};
