var appendInput = function(d3, root, i, uponAdd, uponUpdate) {
  var input = root.append('input')
        .attr('type', 'text'),
      button = root.append('button')
        .text('Add'),
      onClick = function() {
        if (!input.node().value) return;
        button.text('Update');
        button.on('click', function() {
          if (!input.node().value) return;
          uponUpdate(i, input.node().value);
        });
        appendInput(d3, root, i+1, uponAdd, uponUpdate);
        uponAdd(i, input.node().value);
      };
  button.on('click', onClick);
  root.append('br');
  input.on('keyup', function() {
    d3.event.stopPropagation();
    if (d3.event.key === 'Enter') {
      onClick();
    }
  });
  input.node().focus();
};

var addExistingInputs = function(d3, root, existingTexts, uponUpdate) {
  var i, input, button;
  for (i=0; i < existingTexts.length; i++) {
    input = root
      .append('input')
      .attr('type', 'text');
    input.node().value = existingTexts[i];
    button = root
      .append('button')
      .text('Update')
      .on('click', function() {
        if (!input.node().value) return;
        uponUpdate(i, input.node().value);
      });
    root.append('br');
  }
};

exports.setup = function(d3, selector, existingTexts, uponAdd, uponUpdate) {
  var root = d3.select(selector);
  addExistingInputs(d3, root, existingTexts, uponUpdate);
  appendInput(d3, root, existingTexts.length, uponAdd, uponUpdate);
};
