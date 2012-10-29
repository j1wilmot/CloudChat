$(document).ready(init);
// TODO use module pattern
var GLOBAL = {};
GLOBAL.system = "System";
GLOBAL.webSocket = null;

function init() {
	initWebwebSocket();
	initSend();
	$('#login-button').click(function() {
		try_login();
	});
	$('#logout').click(function() {
		logout();
	});
}

function initSend() {
	// Send text over websocket when send button is clicked
	$('#send-button').click(function() {
		if (GLOBAL.webSocket.readyState === 1) {
			var text = $('#send-text').val();
			var message = ' { "action":"message", "message": "' + text + '" }';
			GLOBAL.webSocket.send(message);
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

function initWebwebSocket() {
	GLOBAL.webSocket = new WebSocket("ws://localhost:8080/");
	GLOBAL.webSocket.onopen = wsOnOpen;
	GLOBAL.webSocket.onmessage = wsOnMessage;
}

function wsOnOpen() {
	log('Server connection established');
}

function wsOnMessage(event) {
	var json = JSON.parse(event.data);
	console.log(json);
	if (json.action === "user_join") {
		addUser(json.user, json.time);
	} else if (json.action === "user_leave") {
		removeUser(json.user, json.time);
	} else if (json.action === "message") {
		addMessage(json.time, json.user, json.message);
	} else if (json.action === "login_success") {
		processLogin(json);
	} else if (json.action === "login_rejected") {
		processRejection(json);
	}
	scrollMessagesToBottom();
}

function logout() {
	// Clear out any notifications that may remain from a previous login
	// We don't do this on login becuase removal shows before fade effect
	$('#notification').empty();
	$('#notification').hide();
	var message = "{ \"action\":\"logout\" }"
	GLOBAL.webSocket.send(message);
	$('#login-cover').fadeIn(400);
}

function deleteMessages() {
	$('#messages').empty();
}

function deleteUserList() {
	$('#users').empty();
}

function try_login() {
	var username = $('#login-name').val();
	var message = "{ \"action\":\"login-attempt\", \"username\":\"" + username + "\" }"
	if (GLOBAL.webSocket.readyState === 3) {
		// clear existing notifications
		$('#notification').empty();
		var message = "Error: unable to connect to server. Please verify server is running and refresh the page."
		$('#notification').append(message);
		$('#notification').show();
	} else {
		// Send login message, wait for login success or failure response
		GLOBAL.webSocket.send(message);	
	}
}

function processRejection(json) {
	var username = json.user;
	var message = "User '" + username + "' is already logged in. Please choose a different name.";
	$('#notification').append(message);
	$('#notification').show();
}

// User has logged in successfully
function processLogin(json) {
	// Delete any existing messages and users remaining from previous login
	// We don't do this on logout because it shows before fade effect finishes
	deleteMessages();
	deleteUserList();

	var usernames = json.usernames;
	for (var i = 0; i < usernames.length; i++) {
		var user = usernames[i];
		addUserToUserList(user);
	}
	$('#login-cover').fadeOut(400);
	var time = json.time;
	addMessage(time, GLOBAL.system, "Login successful");
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

function addMessage(time, user, text) {
	var klass = (user === GLOBAL.system) ? 'sys-msg' : 'usr-msg';
	var message = '<span class="' + klass + '">' + user + ' (' + time + ') </span>' + text;
	$('#messages').append('<div>' + message + '</div>');
}

function padDateField(dateField) {
	return (dateField.toString().length === 1) ?
		"0" + dateField :
		dateField;
}

// Need to pad time fields if single digit
function getTime() {
	var date = new Date();
	var hours = padDateField(date.getHours());
	var minutes = padDateField(date.getMinutes());
	var seconds = padDateField(date.getSeconds());
	return hours + ':' + minutes + ':' + seconds;
}

function log(text) {
	var time = getTime();
	console.log(time + ": " + text);
}
