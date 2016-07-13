exports.union = function(d3, a, b, acc) {
  var a2 = acc ? a.map(acc) : a,
      b2 = acc ? b.map(acc) : b,
      arr = a.slice(0),
      set = d3.set(a2);
  for (var i=0, m=b2.length; i<m; i++) {
    if (!set.has(b2[i])) arr.push(b[i]);
  }
  return arr;
};

exports.intersection = function(d3, a, b, acc) {
  var a2 = acc ? a.map(acc) : a,
      b2 = acc ? b.map(acc) : b,
      arr = [],
      set = d3.set(a2);
  for (var i=0, m=b2.length; i<m; i++) {
    if (set.has(b2[i])) arr.push(b[i]);
  }
  return arr;
};

exports.difference = function(d3, a, b, acc) {
  var a2 = acc ? a.map(acc) : a,
      b2 = acc ? b.map(acc) : b,
      arr = [],
      set = d3.set(b2);
  for (var i=0, m=a.length; i<m; i++) {
    if (!set.has(a2[i])) arr.push(a[i]);
  }
  return arr;
};

// Return an array containing 3 things:
// 0. items unique to first array
// 1. items common to both arrays (i.e. the intersection)
// 2. items unique to second array
exports.venn = function(d3, a, b, acc) {
  return [
    exports.difference(d3, a, b, acc),
    exports.intersection(d3, a, b, acc),
    exports.difference(d3, b, a, acc),
  ];
};
