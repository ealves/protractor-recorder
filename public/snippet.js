var socket = io('http://localhost:9000');
document.body.addEventListener('mousedown', function (event) {
  var xPath = getPathTo(event.target);
  var ngRepeat = getNgRepeat(event);
  var offsetParent = event.target.offsetParent ? event.target.offsetParent.outerHTML : event.target.parentNode;

  var element = {
      xPath: xPath,
      outerHTML: event.target.outerHTML,
      offsetParent: {'outerHTML': offsetParent}
  };

  if(ngRepeat)
    element.ngRepeat = {value: ngRepeat, rowIndex: event.target.parentNode.rowIndex.toString()};

  socket.emit('onclick', element);
});
document.body.addEventListener('keyup', function (event) {
  socket.emit('onkeyup', event.target.value);
});
document.body.addEventListener('mouseup', function (event) {
  if (window.getSelection && window.getSelection().toString() != '') {
    socket.emit('onassertion', window.getSelection().toString());
  } else if (document.selection && document.selection.createRange().text != '') {
    socket.emit('onassertion', document.selection.createRange().text);
  }
});
function getNgRepeat(event) {
  if(event.target.parentNode.getAttribute('ng-repeat')){
    return event.target.parentNode.getAttribute('ng-repeat');
  }
  return false;
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