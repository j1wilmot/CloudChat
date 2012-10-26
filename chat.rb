require 'em-websocket'


class Connection

	attr_accessor :name, :websocket

	def initialize(name, websocket)
		@name = name
		@websocket = websocket
	end
end

class Server

	def initialize()
		#session => connection
		@open_connections = {}
	end

	def start()
		log "Starting chat server..."
		EventMachine::WebSocket.start(:host => "0.0.0.0", :port => 8080) do |ws|
			ws.onopen { open_connection(ws) }
			ws.onmessage { |msg| send_user_message_to_all(ws, msg); }
			ws.onclose { remove_connection(ws) }
		end
		log "Server has been shut down."
	end

	def open_connection(ws)
		name = "User#{@open_connections.size + 1}"
		new_connection = Connection.new(name, ws)
		@open_connections[ws] = new_connection
		send_system_message_to_all(ws, "#{name} has joined the chat.")
		log "#{name} has logged in."
	end

	# Send a message to all open connections
	def send_user_message_to_all(ws, msg)
		user_name = @open_connections[ws].name
		@open_connections.each_value do |connection|
			connection.websocket.send("#{user_name}: #{msg}")
		end
	end

	def send_system_message_to_all(ws, msg)
		msg = "<span class='sys-msg'>#{msg}</span>"
		@open_connections.each_value do |connection|
			connection.websocket.send(msg)
		end
	end

	def remove_connection(ws)
		connection = @open_connections.delete(ws)
		msg = "#{connection.name} has logged out."
		log(msg)
		send_system_message_to_all(ws, msg)
	end

	def log(msg)
		puts msg
	end
end

server = Server.new
server.start