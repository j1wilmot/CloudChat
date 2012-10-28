require 'em-websocket'
require 'json'

class Message

	attr_reader :type, :message, :time

	def initialize(type, message)
		@type = type
		@message = message
		@time = Date.new
	end
end

class Connection

	attr_reader :name, :websocket

	def initialize(name, websocket)
		@name = name
		@websocket = websocket
	end
end

class Server

	def initialize()
		#session => connection
		@open_connections = {}
		@@userNum = 0
	end

	def start()
		log "Starting chat server..."
		EventMachine::WebSocket.start(:host => "0.0.0.0", :port => 8080) do |ws|
			ws.onopen { open_connection(ws) }
			ws.onmessage { |message| send_message(ws, message) }
			ws.onclose { remove_connection(ws) }
		end
		log "Server has been shut down."
	end

	def send_message(ws, message)
		name = @open_connections[ws].name
		json = JSON user: name, message: message, time: get_time()
		send(json)
		log(json)
	end

	def open_connection(ws)
		name = "User#{@@userNum}"
		@@userNum += 1
		new_connection = Connection.new(name, ws)
		@open_connections[ws] = new_connection
		provide_user_list(ws)
		message = JSON action: "user_join", user: name, time: get_time()
		send_to_others(message, ws)
	end

	def provide_user_list(ws)
		usernames = []
		@open_connections.each_value do |connection|
			usernames << connection.name
		end
		message = JSON usernames: usernames
		ws.send(message)
		log(message)
	end

	def remove_connection(ws)
		connection = @open_connections.delete(ws)
		message = JSON action: "user_leave", user: connection.name, time: get_time()
		send(message)
	end

	def get_time()
		Time.now.strftime("%H:%M:%S")
	end

	# Sends message to all websockets, excluding provided websocket
	def send_to_others(message, ws_to_exclue)
		@open_connections.each_value do |connection|
			connection.websocket.send(message) unless connection.websocket == ws_to_exclue
		end
		log(message)
	end

	def send(message)
		@open_connections.each_value do |connection|
			connection.websocket.send(message)
		end
		log(message)
	end

	def log(message)
		puts message
	end
end

server = Server.new
server.start