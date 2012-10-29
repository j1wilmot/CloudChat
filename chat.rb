require 'em-websocket'
require 'json'

# Curretly a User is just a username and an active websocket connection
class User

	attr_reader :name, :websocket

	def initialize(name, websocket)
		@name = name
		@websocket = websocket
	end
end

# WebSocket server for our chat application
class Server

	def initialize()
		# websocket => connection
		@users = {}
	end

	def start()
		log "Starting chat server..."
		EventMachine::WebSocket.start(:host => "0.0.0.0", :port => 8080) do |ws|
			ws.onopen { log "A new ws connection has been established." }
			ws.onmessage { |message| handle_message(ws, message) }
			ws.onclose { remove_connection(ws) }
		end
		log "Server has been shut down."
	end

	# Handle messages we receive from clients
	# Generally we broadcast user actions to other clients
	def handle_message(ws, message)
		json = JSON.parse message
		log("Incoming: " + json.to_s)
		if json["action"] == "login-attempt"
			username = json["username"]
			login(ws, username)
		elsif json["action"] == "logout"
			remove_connection(ws)
		elsif json["action"] == "message"
			text = json["message"]
			send_message(ws, text)
		end
	end

	def send_message(ws, message)
		name = @users[ws].name
		json = JSON action: "message", user: name, message: message, time: get_time()
		send(json)
	end

	def login(ws, username)
		if username_already_connected(username)
			reject_login(ws, username)
		else
			accept_login(ws, username)
		end
	end

	def reject_login(ws, username)
		message = JSON.generate action: "login_rejected", user: username, time: get_time()
		ws.send(message)
	end

	def accept_login(ws, name)
		add_connection(ws, name)
		provide_user_list_to_new_connection(ws)
		send_user_join_notification_to_other_connections(ws, name)
	end

	def add_connection(ws, name)
		@users[ws] = User.new(name, ws)
	end

	def send_user_join_notification_to_other_connections(ws, name)
		message = JSON action: "user_join", user: name, time: get_time()
		send_to_others(message, ws)
	end

	# Return true if username associated with a connection, else false
	def username_already_connected(username)
		@users.each_value do |connection|
			name = connection.name
			if name == username
				return true
			end
		end
		return false
	end

	# Send list of connected usernames to new connection
	# Used client side to populate chatroom user list
	def provide_user_list_to_new_connection(ws)
		usernames = collect_connected_usernames()
		message = JSON action: "login_success", usernames: usernames, time: get_time()
		ws.send(message)
		log("Outgoing: " + message)
	end

	# Returns array of connected usernames
	def collect_connected_usernames()
		# Must be a better way to do this, but this works for now
		usernames = []
		@users.each_value do |connection|
			usernames << connection.name
		end
		return usernames
	end

	# Handle user disconnect / logout
	# Remove connection and notify other clients of disconnect
	def remove_connection(ws)
		connection = @users.delete(ws)
		if connection == nil
			# A client has disconnected while in "logged out" state
			log "A ws connection has been disconnected."
			return
		end
		message = JSON action: "user_leave", user: connection.name, time: get_time()
		send(message)
	end

	# Send message to all connected users, excluding provided websocket
	def send_to_others(message, ws_to_exclue)
		@users.each_value do |connection|
			connection.websocket.send(message) unless connection.websocket == ws_to_exclue
		end
		log("Outgoing: " + message)
	end

	# Send message to all connected users
	def send(message)
		send_to_others(message, nil)
	end

	def get_time()
		Time.now.strftime("%H:%M:%S")
	end

	def log(message)
		puts "#{get_time()}: #{message}"
	end
end

server = Server.new
server.start
