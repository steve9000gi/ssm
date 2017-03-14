var modSelectedColor = require('./selected-color.js');

exports.hideText = "Hide system support rings";
exports.center = null;
exports.visible = true;

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
  var rings = [{"id": "ring0", "labelId": "lid0", "name": "Role/Identity", "radius": 110,
                "color": "#" + modSelectedColor.colorChoices[6]},
               {"id": "ring1", "labelId": "lid1", "name": "Most Important Responsibilities",
		"radius": 275, "color": "#" + modSelectedColor.colorChoices[5]},
               {"id": "ring2", "labelId": "lid2", "name": "General Needs for Each Responsibility",
	        "radius": 475,
                "color": "#" + modSelectedColor.colorChoices[4]},
               {"id": "ring3", "labelId": "lid3", "name": "Available Resources", "radius": 675,
                "color": "#" + modSelectedColor.colorChoices[7]} ];
  d3.select("#graphG").append("g")
    .classed({"ssmGroup": true, "ssmHidden": true, "ssmVisible": false});
  exports.visible = false;
  d3.select(".ssmGroup").selectAll(".ssmCircle")
    .data(rings)
    .enter().append("circle")
      .attr("id", function(d) {
	return d.id;
      })
      .classed("ssmCircle", true)
      .style("stroke", function(d) {
        return d.color;
      })
      .style("fill", "none")
      .attr("r", function(d) { return d.radius; });
  rings.push({"labelId": "lid4", "name": "Wish List", "radius": 750,
              "color": "#" + modSelectedColor.colorChoices[2]});
  d3.select(".ssmGroup").selectAll(".ssmLabel")
    .data(rings)
    .enter().append("text")
      .attr("id", function(d) {
	return d.labelId;
      })
      .classed("ssmLabel", true)
      .style("fill", function(d) { return d.color; })
      .text(function(d) { return d.name; });
};
