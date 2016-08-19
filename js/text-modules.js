// Text modules are stored as YAML files in the `/strings/` directory. To use
// the non-default one, specify the name of the text module (without the .yaml
// extension) in the URL like so:
// http://syssci.renci.org/ssm/?module=NAME

exports.module = null;

var listToHtml = function(d3, items) {
  return items.map(function(i){ return '<li>' + i + '</li>';}).join('\n');
};

var parasToHtml = function(d3, paras) {
  return paras.map(function(i){ return '<p>' + i + '</p>';}).join('\n');
};

var linkToHtml = function(d3, link) {
  return '<a href="' + link + '" target="_blank">this survey</a>\n';
};

var fillStrings = function(d3, strings) {
  d3.selectAll('[data-string]')
    .each(function(){
      var sel = d3.select(this),
          str = sel.attr('data-string'),
          type = str.split('.')[1] || 'plain';
      if (type === 'plain') {
        sel.text(strings[str]);
      } else if (type === 'paras') {
        this.innerHTML = parasToHtml(d3, strings[str]);
      } else if (type === 'list') {
        this.innerHTML = listToHtml(d3, strings[str]);
      } else if (type === 'link') {
	this.innerHTML = linkToHtml(d3, strings[str]);
      }
    });
};

exports.setup = function(d3) {
  var queryStr = window.location.search,
      re = /\bmodule=([^&]+)/,
      match = re.exec(queryStr),
      module = match && decodeURIComponent(match[1]) || 'default',
      url = module && 'strings/' + module + '.yaml';
  if (!url) return;
  d3.xhr(url)
    .get(function(error, data) {
      if (error) {
        console.error('GET ' + url + ' failed with status ' + error.status + ' and response text ' + error.response);
      } else {
        exports.module = module;
        var strings = window.jsyaml.safeLoad(data.response);
        fillStrings(d3, strings);
      }
    });
};
