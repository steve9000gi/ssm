exports.visible = false;
exports.center = null;
exports.hideText = 'Hide Circles of Care';

// Create three concentric circles.
exports.create = function(d3) {
  d3.select("#graphG").append("g")
    .attr("id", "circlesOfCareGroup")
    .classed("visible", exports.visible);
  d3.select("#circlesOfCareGroup").selectAll(".cOfC")
    .data([75, 200, 350])
    .enter().append("circle")
      .classed("cOfC", true)
      .style("fill", "none")
      .attr("r", function(d) {
        return d;
      });
};

exports.show = function(d3) {
  if (!exports.center) {
    exports.center = {
      "x": d3.select("#topGraphDiv").node().clientWidth / 2,
      "y": d3.select("#topGraphDiv").node().clientHeight / 2};
  }
  exports.visible = true;
  d3.select("#circlesOfCareGroup").classed("visible", exports.visible);
  d3.selectAll(".cOfC")
    .attr("cx", exports.center.x)
    .attr("cy", exports.center.y);
  d3.select("#cOfCItem").text(exports.hideText)
    .datum({"name": exports.hideText});
};

exports.hide = function(d3) {
  exports.center = null;
  exports.visible = false;
  d3.select("#circlesOfCareGroup").classed("visible", exports.visible);
  d3.select("#cOfCItem").text("Show Circles of Care")
    .datum({"name": "Show Circles of Care"});
};
