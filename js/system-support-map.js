var modSelectedColor = require('./selected-color.js');

exports.hideText = "Hide system support rings";
exports.center = null;
exports.visible = true;
exports.ringRadii = [110, 275, 475, 675];

// Center circles and text in window
exports.show = function(d3) {
  if (!exports.center) {
    exports.center = {
      "x": d3.select("#topGraphDiv").node().clientWidth / 2,
      "y": d3.select("#topGraphDiv").node().clientHeight / 2};
  }
  var ssmCenter = exports.center;
  d3.select(".ssmGroup")
    .classed({"ssmHidden": false, "ssmVisible": true});
  exports.visible = true;
  d3.selectAll(".ssmCircle")
    .attr("cx", ssmCenter.x)
    .attr("cy", ssmCenter.y);
  d3.selectAll(".ssmLabel")
    .style("font-size", "12px")
    .attr("x", function() {
      return ssmCenter.x - this.getComputedTextLength() / 2;
    })
    .attr("y", function(d, i) {
      var offset = [20, 28, 26, 18, 64];
      return ssmCenter.y - d.radius + offset[i];
    });
  d3.select("#sysSptRingsItem").text(exports.hideText)
    .datum({"name": exports.hideText});
};

exports.hide = function(d3) {
  exports.center = null;
  d3.select(".ssmGroup")
    .classed({"ssmHidden": true, "ssmVisible": false});
  exports.visible = false;
  d3.select("#sysSptRingsItem").text("Show system support rings")
    .datum({"name": "Show system support rings"});
};

// Create four concentric rings and five labels (one for each rings and one for
// the outside)
exports.create = function(d3) {
  var rings = [{"name": "Role/Identity",
                "color": "#" + modSelectedColor.colorChoices[6]},
               {"name": "Most Important Responsibilities",
                "color": "#" + modSelectedColor.colorChoices[5]},
               {"name": "General Needs for Each Responsibility",
                "color": "#" + modSelectedColor.colorChoices[4]},
               {"name": "Available Resources",
                "color": "#" + modSelectedColor.colorChoices[7]}
              ].map(function(d,i) {
                d.radius = exports.ringRadii[i];
                return d;
              });
  d3.select("#graphG").append("g")
    .classed({"ssmGroup": true, "ssmHidden": true, "ssmVisible": false});
  exports.visible = false;
  d3.select(".ssmGroup").selectAll(".ssmCircle")
    .data(rings)
    .enter().append("circle")
      .classed("ssmCircle", true)
      .style("stroke", function(d) {
        return d.color;
      })
      .style("fill", "none")
      .attr("r", function(d) { return d.radius; });
  rings.push({"name": "Wish List", "radius": 750, "color": "#" + modSelectedColor.colorChoices[2]});
  d3.select(".ssmGroup").selectAll(".ssmLabel")
    .data(rings)
    .enter().append("text")
      .classed("ssmLabel", true)
      .style("fill", function(d) { return d.color; })
      .text(function(d) { return d.name; });
};
