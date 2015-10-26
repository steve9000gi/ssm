var modSelectedColor = require('./selected-color.js');

exports.thickness = 3;

exports.createSubmenu = function(d3) {
  d3.select("#setLineThicknessItem").append("div")
    .classed("menuHidden", true).classed("menu", false)
    .attr("id", "edgeThicknessSubmenuDiv")
    .attr("position", "absolute")
    .style("width", "90px")
    .on("mouseleave", function() {
      d3.select("#edgeThicknessSubmenuDiv").classed("menu", false).classed("menuHidden", true);
    })
    .on("mouseup", function() {
      d3.select("#edgeThicknessSubmenuDiv").classed("menu", false).classed("menuHidden", true);
    });
  var choices = [1, 2, 3, 4, 5, 6, 7];
  d3.select("#edgeThicknessSubmenuDiv").append("ul").attr("id", "edgeThicknessSubmenuList");
  d3.select("#edgeThicknessSubmenuList").selectAll("li.edgeThicknessSubmenuListItem")
    .data(choices).enter()
    .append("li")
      .classed("edgeThicknessSubmenuListItem", true)
      .attr("id", function(d, i) { return "edgeThicknessOption" + i; })
      .text(function(d) { return d + " pixel" + (d > 1 ? "s" : ""); })
      .style("text-shadow", function() {
        return (parseInt(d3.select(this).datum(), 10) === exports.thickness)
          ? "1px 1px #000000" : "none"; })
      .style("color", function() {
        return (parseInt(d3.select(this).datum(), 10) === exports.thickness)
          ? modSelectedColor.color : modSelectedColor.unselected;
      })
      .on("mouseup", function() {
        d3.select("#edgeThicknessSubmenuDiv").classed("menu", false).classed("menuHidden", true);
        d3.select("#optionsMenuDiv")
          .classed("menu", false).classed("menuHidden", true);
        exports.thickness = parseInt(d3.select(this).datum(), 10);
        d3.selectAll(".edgeThicknessSubmenuListItem")
          .style("color", modSelectedColor.unselected)
          .style("text-shadow", "none");
        d3.select(this)
          .style("color", modSelectedColor.color)
          .style("text-shadow", "1px 1px #000000");
      });
};
