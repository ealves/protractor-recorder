var head   = document.getElementsByTagName("head")[0],
    script = document.createElement("script");
script.onload = function () {
  var s = document.createElement("script");
  s.src = "http://localhost:9000/snippet.js";
  head.appendChild(s);
};
script.src = "https://cdn.socket.io/socket.io-1.3.7.js";
head.appendChild(script);