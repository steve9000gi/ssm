
// http://warpycode.wordpress.com/2011/01/21/calculating-the-distance-to-the-edge-of-an-ellipse/
// Angle theta is measured from the -y axis (recalling that +y is down)
// clockwise.
exports.computeEllipseBoundary = function(edge) {
  var dx = edge.target.x - edge.source.x;
  var dy = edge.target.y - edge.source.y;
  var rx  = edge.target.rx,
      ry  = edge.target.ry;
  var h = Math.sqrt(dx * dx + dy * dy);
  var s = dx / h; // sin theta
  var c = dy / h; // cos theta
  var length = Math.sqrt(1 / ((s / rx) * (s / rx) + (c / ry) * (c / ry)));
  var offset = 18;
  return length + offset;
};

// Angle theta is measured from -y axis (up) clockwise.
exports.computeRectangleBoundary = function(edge) {
  var dx = Math.abs(edge.source.x - edge.target.x);
  var dy = Math.abs(edge.target.y - edge.source.y);
  var hyp = Math.sqrt(dx * dx + dy * dy);
  var absCosTheta = dy / hyp; // Absolute value of cosine theta
  var w = edge.target.width / 2;
  var h = edge.target.height / 2;
  var thresholdCos = h / Math.sqrt(w * w + h * h); // cos of angle where intersect switches sides
  var offset = 22; // Give the arrow a little breathing room
  return ((absCosTheta > thresholdCos) ? h * hyp / dy : w * hyp / dx) + offset;
};
