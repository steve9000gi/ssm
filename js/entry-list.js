var datalistId = function(selector) {
  // FIXME: this assumes the selector is an id selector, like '#selector'. It
  // doesn't have to be.
  return selector.slice(1) + '_datalist';
};

var onClickAdd = function(d3, selector, data,
                          uponAdd, uponUpdate, uponRemove, root) {
  return function(d,i){
    // + 1 for base-1 counting in `nth-child` selectors, and +1 for the
    // `<datalist>` element, which is an earlier sibling in the document.
    var inputSelector = 'span.entry:nth-child(' + (i+2) + ') input',
        newText = root.select(inputSelector).property('value'),
        newData = data.slice(0);
    if (newText !== '') {
      newData.push(newText);
      uponAdd(i, newText);
      update(d3, selector, newData, uponAdd, uponUpdate, uponRemove);
    }
  };
};

var onClickUpdate = function(d3, selector, data,
                             uponAdd, uponUpdate, uponRemove, root) {
  return function(d,i){
    var inputSelector = 'span.entry:nth-child(' + (i+2) + ') input',
        newText = root.select(inputSelector).property('value'),
        newData = data.slice(0);
    if (newText !== '') {
      newData[i] = newText;
      uponUpdate(i, newText);
      update(d3, selector, newData, uponAdd, uponUpdate, uponRemove);
    }
  };
};

var onClickRemove = function(d3, selector, data,
                             uponAdd, uponUpdate, uponRemove, root) {
  return function(d,i){
    var inputSelector = 'span.entry:nth-child(' + (i+2) + ') input',
        newText = root.select(inputSelector).property('value'),
        removed = data.slice(0,i).concat(data.slice(i+1, data.length)),
        newData = uponRemove(i) ? removed : data;
    d3.select(this.parentElement).remove();
    update(d3, selector, newData, uponAdd, uponUpdate, uponRemove);
  };
};

// This is based on the "general update pattern" in d3.
// For more info, see: http://bl.ocks.org/mbostock/3808234
var update = function(d3, selector, data, uponAdd, uponUpdate, uponRemove) {
  // Remove any empty entries with an "Add" button, to ensure that the final
  // "add" input is always in the "enter" selection.
  d3.select(selector).selectAll('span.entry button.add').each(function(d,i){
    var parentSel = d3.select(this.parentElement);
    if (parentSel.select('input').property('value') === '') {
      parentSel.remove();
    }
  });

  var root = d3.select(selector).selectAll('span.entry').data(data.concat("")),
      args = [d3, selector, data, uponAdd, uponUpdate, uponRemove, root];

  // These commands are only for the "update" selection, i.e. pre-existing
  // 'span.entry' elements.
  root.selectAll('button').remove();
  root.append('button').attr('class', 'update').text('Update');
  root.append('button').attr('class', 'remove').text('Remove');
  root.select('input').on('keyup', function(d,i){
    var key = d3.event.key || d3.event.keyIdentifier;
    d3.event.stopPropagation();
    if (key === 'Enter') {
      onClickUpdate.apply(null, args).call(null, d, i);
    }
  });

  // The `enter()` starts modifying the "enter" selection, i.e. data elements
  // for which there are no corresponding document elements.
  var newSpans = root.enter().append('span').attr('class', 'entry');
  newSpans.append('input')
    .attr('type', 'text')
    .attr('list', datalistId(selector))
    .on('keyup', function(d,i){
      var key = d3.event.key || d3.event.keyIdentifier;
      d3.event.stopPropagation();
      if (key === 'Enter') {
        onClickAdd.apply(null, args).call(null, d, i);
      }
    });
  newSpans.append('button').attr('class', 'add').text('Add');
  newSpans.select('input').node().focus();

  // Now edit both enter and update selections together.
  root.select('input').property('value', function(d){ return d; });
  root.select('button.add')   .on('click', onClickAdd   .apply(null, args));
  root.select('button.update').on('click', onClickUpdate.apply(null, args));
  root.select('button.remove').on('click', onClickRemove.apply(null, args));
  root.selectAll('br').remove();
  root.append('br');

  // Finally, remove any document elements that no longer have a corresponding
  // data element:
  root.exit().remove();
};

exports.setup = function(d3, selector, existingTexts, completions,
                         uponAdd, uponUpdate, uponRemove) {
  // Be sure to add the datalist as the first child element, for the sake of the
  // `nth-child` selections above.
  d3.select(selector)
    .append('datalist')
    .attr('id', datalistId(selector))
    .selectAll('option')
    .data(completions)
    .enter().append('option')
    .attr('value', String);
  var data = existingTexts.slice(0),
      root = d3.select(selector).selectAll('span.entry').data(data),
      newSpans = root.enter().append('span').attr('class', 'entry');
  newSpans.append('input').attr('type', 'text');
  update(d3, selector, data, uponAdd, uponUpdate, uponRemove);
};

exports.teardown = function(d3, selector) {
  d3.select(selector).selectAll('span.entry').remove();
  d3.select(datalistId(selector)).remove();
};
