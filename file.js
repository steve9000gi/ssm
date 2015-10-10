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
  var thisGraph = this;
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
