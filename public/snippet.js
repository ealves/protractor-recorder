var socket = io('http://localhost:9000');
document.body.addEventListener('click', function (event) {
	socket.emit('onclick', {'outerHTML': event.target.outerHTML, 'offsetParent': {'outerHTML': event.target.offsetParent.outerHTML}});
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
document.body.addEventListener('focus', function (event) {
	socket.emit('onfocus', event);
});
document.body.addEventListener('unload', function (event) {
	socket.emit('onunload', event);
});