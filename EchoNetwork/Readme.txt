Echo Client and Server

How to use:
  ./client <hostname> <portnum>
  ./server <portnum>
  
What it does:
  Input into client is sent to server.
  Server received packages and repeats contents of client message
  If the server is unresponsive, or the client does not input
  messages for a period of time, the program times out
  
Implementation:
  Client is implemented in Python 2.7
  Server is implemented in Node.js
