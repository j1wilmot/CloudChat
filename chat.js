$(document).ready(init);
var GLOBAL = {};
GLOBAL.system = "System";
GLOBAL.text_focused = false;

function init() {
	initWebwebSocket();
	initSend();
	$('#send-text').val("Type messagess here...");
	$('#send-text').click(function() {
		if (!GLOBAL.text_focused) {
			$('#send-text').val('');
			GLOBAL.text_focused = true;
		}
	});
}

function initWebwebSocket() {
	GLOBAL.webSocket = new WebSocket("ws://localhost:8080/");
	GLOBAL.webSocket.onopen = wsOnOpen;
	GLOBAL.webSocket.onmessage = wsOnMessage;
	GLOBAL.webSocket.onerror = function() {
		console.log("error");
		addMessage(getTime(), GLOBAL.system, "ERROR");
	};
}

function wsOnMessage(event) {
	var obj = JSON.parse(event.data);
	console.log(obj);
	if (obj.action === "user_join") {
		addUser(obj.user, obj.time);
	} else if (obj.action === "user_leave") {
		removeUser(obj.user, obj.time);
	} else if (obj.user) {
		addMessage(obj.time, obj.user, obj.message);
	} else if (obj.usernames) {
		var usernames = obj.usernames;
		for (var i = 0; i < usernames.length; i++) {
			var user = usernames[i];
			addUserToUserList(user);
		}
	}
	scrollMessagesToBottom();
}

function scrollMessagesToBottom() {
	$("#messages").scrollTop($("#messages")[0].scrollHeight);
}

function addUser(user, time) {
	addUserToUserList(user);
	addMessage(time, GLOBAL.system, user + ' has joined the chat');
}

function addUserToUserList(user) {
	$(users).append('<div id="' + user + '" class="username">' + user + '</div>');
}

function removeUser(user, time) {
	var userSelector = '#' + user;
	$(userSelector).remove()
	addMessage(time, GLOBAL.system, user + ' has left the chat');
}

function wsOnOpen() {
	var time = getTime();
	addMessage(time, GLOBAL.system, 'Server connection established');
}

// Need to pad time fields if single digit
function getTime() {
	var date = new Date();
	var hours = padDateField(date.getHours());
	var minutes = padDateField(date.getMinutes());
	var seconds = padDateField(date.getSeconds());
	return hours + ':' + minutes + ':' + seconds;
}

function padDateField(dateField) {
	return (dateField.toString().length === 1) ?
		"0" + dateField :
		dateField;
}

function addMessage(time, user, text) {
	var klass = (user === GLOBAL.system) ? 'sys-msg' : 'usr-msg';
	var message = '<span class="' + klass + '">' + user + ' (' + time + ') </span>' + text;
	$('#messages').append('<div>' + message + '</div>');
}

function initSend() {
	// Send text over websocket when send button is clicked
	$('#send-button').click(function() {
		if (GLOBAL.webSocket.readyState === 1) {
			var text = $('#send-text').val();
			GLOBAL.webSocket.send(text);
			$('#send-text').val("");
		} else {
			log("System not in state to send message");
		}
	});
	// Set enter key to trigger send button
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
