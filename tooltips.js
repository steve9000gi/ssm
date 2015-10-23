exports.tip = null;

// "Notes" == tooltips
exports.setupNotes = function(d3) {
  exports.tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .style("font-family", "Arial")
    .style("font-weight", "bold")
    .html(function (d) {
      d3.select(".d3-tip")
        .style("display", function() { return d.note ? "block" : "none"; });
      return  d.note || null;
    });
  d3.select("#mainSVG").call(exports.tip);
};
