var modSelectedColor = require('./selected-color.js'),
    modSelectedShape = require('./selected-shape.js');

exports.maxCharsPerLine = 20;

// FIXME: seems to be unused anywhere.
var appendText = function(gEl, phrases, yShift) {
  var thisGraph = this;
  var nPhrases = phrases.length;
  var el = gEl.append("text")
        .classed("foregroundText", true)
        .attr("text-anchor","left")
        .attr("alignment-baseline", "middle")
        .attr("text-decoration", function(d) {
          return d.url ? "underline" : "none"; })
        .style("font-weight", function(d) {
          return d.url ? thisGraph.boldFontWeight: "none"; })
        .style("fill", gEl[0][0].__data__.color)
        .attr("dy",  function() {
          return yShift - ((nPhrases - 1) * thisGraph.consts.defaultFontSize / 2);
        });
  el.selectAll("tspan")
    .data(phrases)
    .enter().append("tspan")
    .text(function(d) { return d; })
    .attr("dy", function(d, i) {
      return (i > 0) ? thisGraph.consts.defaultFontSize : null;
    });
  return el;
};

// Split text into single words, then group them into lines. Arg "element" is a
// shape or an edge.
var splitTextIntoLines = function(element) {
  var words = (element.name) ? element.name.split(/\s+/g) : [""];
  var nwords = words.length;
  var phrases = [];
  var wordIx = 0;
  var currPhrase = "";
  var maxChars = exports.maxCharsPerLine;
  if (element.maxCharsPerLine) {
    maxChars = element.maxCharsPerLine;
  } else {
    element.maxCharsPerLine = maxChars;
  }
  while (wordIx < nwords) {
    if (words[wordIx].length >= maxChars) {
      phrases.push(words[wordIx++]);
    } else {
      while ((wordIx < nwords) && ((currPhrase.length + words[wordIx].length) < maxChars)) {
        currPhrase +=  words[wordIx++];
        if ((wordIx < nwords) && ((currPhrase.length + words[wordIx].length) < maxChars)) {
          currPhrase += " ";
        }
      }
      phrases.push(currPhrase);
    }
    currPhrase = "";
  }
  return phrases;
};

var appendEdgeShadowText = function(gEl, phrases, yShift) {
  var thisGraph = this;
  var tLen = [0]; // Initialize array with 0 so we don't try to access element at -1
  var el = gEl.append("text")
              .attr("text-anchor","left")
              .attr("alignment-baseline", "middle")
              .attr("text-decoration", function(d) { return d.url ? "underline" : "none"; })
              .style("font-weight", function(d) {
                return d.url ? thisGraph.boldFontWeight: "none";
              })
              .style("stroke", modSelectedColor.bgColor)
              .style("stroke-width", "3px")
              .attr("dy",  function() {
                return yShift - ((phrases.length - 1) * thisGraph.consts.defaultFontSize / 2);
              });
  el.selectAll("tspan")
    .data(phrases)
    .enter().append("tspan")
      .text(function(d) { return d; })
      .attr("dx", function(d, i) {
        tLen.push(this.getComputedTextLength());
        // TODO: fix edge text position when source or target shape is very large (needs to be
        // centered from shape borders, not just shape centers).
        return -(tLen[i] + tLen[i + 1]) / 2;
      })
      .attr("dy", function(d, i) { return (i > 0) ? thisGraph.consts.defaultFontSize : null; });
  return tLen;
};

// Select all text in element: taken from
// http://stackoverflow.com/questions/6139107/
// programatically-select-text-in-a-contenteditable-html-element
exports.selectText = function(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

// Based on
// http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts
// Centers text for shapes and edges in lines whose lengths are determined by
// maxCharsPerLine. Shrinkwraps shapes to hold all the text if previously
// determined size not used.
exports.formatText = function(d3, gEl, d) {
  if (d.manualResize) {
    d.name = "";
  }
  var phrases = splitTextIntoLines(d);
  var tLen = null; // Array of lengths of the lines of edge text
  var yShift = 3; // Align text to edges
  if (d.shape && (d.shape !== "rectangle") && (d.shape !== "noBorder")) {
    yShift = 6;
  }
  if (d.source) { // ...then it's an edge: add shadow text for legibility:
    tLen = appendEdgeShadowText(gEl, phrases, yShift);
  }
  var el = this.appendText(gEl, phrases, yShift);
  if (d.source) { // It's an edge
    el.selectAll("tspan")
      .attr("dx", function(d, i) {
        return -(tLen[i] + tLen[i + 1]) / 2;
      });
  } else { // It's a shape
    el.selectAll("tspan").attr("text-anchor","middle").attr("dx", null).attr("x", 0);
    modSelectedShape.setShapeSizeAndPosition(d3, gEl, el, d);
    modSelectedShape.storeShapeSize(gEl, d);
  }
};
