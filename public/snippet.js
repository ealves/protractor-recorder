var socket = io('http://localhost:9000');
parent.document.body.addEventListener('mousedown', function (event) {

  var ngRepeats = [];
  var xPath = getPathTo(event.target);
  getNgRepeat(event.target, ngRepeats);
  //console.log(ngRepeats);

  var offsetParent = event.target.offsetParent ? event.target.offsetParent.outerHTML : event.target.parentNode;

  var element = {
      xPath: xPath,
      outerHTML: event.target.outerHTML,
      offsetParent: {'outerHTML': offsetParent}
  };

  if(ngRepeats)
    element.ngRepeat = ngRepeats[ngRepeats.length-1];

  socket.emit('onclick', element);
});
parent.document.body.addEventListener('keyup', function (event) {
  socket.emit('onkeyup', event.target.value);
});
parent.document.body.addEventListener('mouseup', function (event) {
  if (window.getSelection && window.getSelection().toString() != '') {
    socket.emit('onassertion', window.getSelection().toString());
  } else if (document.selection && document.selection.createRange().text != '') {
    socket.emit('onassertion', document.selection.createRange().text);
  }
});
function getNgRepeat(element, ngs) {
  var ix = 0;
  if(element.parentNode) {
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
      var sibling = siblings[i];

      if (sibling === element) {
        if(element.getAttribute('ng-repeat')) {
          var rowIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
          ngs.push({value: element.getAttribute('ng-repeat'), rowIndex: rowIndex});
        }
        return getNgRepeat(element.parentNode, ngs);
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
      }
    }
  }
}
function getPathTo(element) {
  if (element.id !== '')
    return "//*[@id='" + element.id + "']";
  if (element === document.body)
    return element.tagName.toLowerCase();
  var ix = 0;
  var siblings = element.parentNode.childNodes;
  for (var i = 0; i < siblings.length; i++) {
    var sibling = siblings[i];
    if (sibling === element) return getPathTo(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
}