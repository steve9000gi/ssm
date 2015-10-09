var modEdgeStyle = require('./edge-style.js');

exports.color = "rgb(229, 172, 247)";
exports.unselected = "#666666";
exports.colorChoices = ["ff0000",  // red
                        "ff8800",  // orange
                        "999900",  // gold
                        "00bd00",  // green
                        "00bdbd",  // cyan/aqua
                        "0000ff",  // dark blue
                        "8800ff",  // purple
                        "000000"], // black
exports.hoverColor = "rgb(200, 238, 241)";
exports.bgColor = "rgb(248, 248, 248)";
exports.clr = '#000000';

exports.createColorPalette = function(d3) {
  var thisGraph = this;
  d3.select("#toolbox").insert("div", ":first-child")
    .attr("id", "colorPalette");
  d3.select("#colorPalette").selectAll(".colorBar")
    .data(exports.colorChoices)
    .enter().append("div")
      .classed("colorBar", true)
      .attr("id", function(d) { return "clr" + d; })
      .style("background-color", function(d) { return "#" + d; })
    .on("mouseover", function() { // Set border to hoverColor if this colorBar is not selected
      var currentColorBar = d3.select(this);
      var currentIdFragment = currentColorBar.attr("id").slice(3);
      if (currentIdFragment !== exports.clr.slice(1)) {
        currentColorBar.style("border-color", exports.hoverColor);
      }
    })
    .on("mouseout", function() { // Set border to black if this colorBar is not selected
      var currentColorBar = d3.select(this);
      var currentIdFragment = currentColorBar.attr("id").slice(3);
      if (currentIdFragment !== exports.clr.slice(1)) {
        currentColorBar.style("border-color", "#000000");
      }
    })
    .on("mouseup", function(d) {
      exports.clr = "#" + d;
      d3.selectAll(".colorBar").each(function() {
        d3.select(this).style("border-color", "#000000");});
      d3.select(this).style("border-color", "#ffffff");
      d3.select("#" + thisGraph.shapeSelected + "Selection")
        .style("stroke", (thisGraph.shapeSelected === "noBorder") ? "none" : exports.clr)
        .style("fill", (thisGraph.shapeSelected === "noBorder") ? exports.clr
                                                                : exports.bgColor);
      var selectedEdgeStyleId = (modEdgeStyle.style === "solid")
                              ? "#solidEdgeSelection" : "#dashedEdgeSelection";
      d3.select(selectedEdgeStyleId).style("stroke", exports.clr)
        .style("marker-end", function() {
          return "url(#end-arrow" + exports.clr.substr(1) + ")";
      });
    });
  d3.select("#clr000000").style("border-color", "#ffffff"); // Initial color selection is black
};
