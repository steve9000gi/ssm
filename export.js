var modCirclesOfCare = require('./circles-of-care.js'),
    modSelectedColor = require('./selected-color.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modText = require('./text.js');

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
  this.updateGraph();
  canvas.remove();
};
