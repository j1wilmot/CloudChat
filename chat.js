$(document).ready(init);
var GLOBAL = {};

function init() {
	initWebwebSocket();
	initSend();
}

function initWebwebSocket() {
	GLOBAL.webSocket = new WebSocket("ws://localhost:8080/");
	GLOBAL.webSocket.onopen = wsOnOpen;
	GLOBAL.webSocket.onmessage = wsOnMessage;
}

function wsOnMessage(event) {
	var msg = event.data;
	addMessage(msg);
	$("#messages").scrollTop($("#messages")[0].scrollHeight);
}

function wsOnOpen() {
	addMessage('<span class="sys-msg">Server connection established.</span>');
}

function addMessage(msg) {
	$('#messages').append('<div>' + msg + '</div>');
}

function initSend() {
	$('#send-button').click(function() {
		if (GLOBAL.webSocket.readyState === 1) {
			var text = $('#send-text').val();
			GLOBAL.webSocket.send(text);
			$('#send-text').val("");
		} else {
			log("System not in state to send message");
		}
	});
	$('#send-text').keydown(function(event) {
	  if ( event.which == 13 ) {
	     $('#send-button').click();
	     event.preventDefault();
	   }
	});
}

function log(text) {
	console.log(text);
}
