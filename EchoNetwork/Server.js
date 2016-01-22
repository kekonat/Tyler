import socket
import time
import threading
import struct
import sys
import random
import struct
import time
import select

# Global Variables Used To Communicate Between Thread and Main Program
timeToDie = False
threadRunning = False
serverDidntRespond = False

# Receive data from Server
def process(s, port):
    global timeToDie
    global threadRunning
    global serverDidntRespond
    threadRunning = True

    while True:
        if timeToDie:
            break

        # Set timeout so we can check if it is time to die
        #s.settimeout(2)
        serverinput, _, _ = select.select([s], [], [], 3)
        if serverinput:
            reply = s.recv(port)
            # Receive data from port and reset timer if packet is valid
            #reply = s.recv(port)
            (magic, version, command, sequence, session) = struct.unpack('!HBBLL', reply);
            serverDidntRespond = False

            # If server says goodbye, terminate
            if (command == 3):
                if not timeToDie:
                    print "GOODBYE from server."
                timeToDie = True
                break

        # If the server is unresponsive, close session
        elif serverDidntRespond:
            print "GOODBYE inactive server."
            timeToDie = True
            break
    threadRunning = False

# Terminate Client Session
def terminate(magic, version, sequence, session, s, host, port):
    global timeToDie

    # Send Server Goodbye message
    timeToDie = True
    header = struct.pack('!HBBLL', magic, version, 3, sequence, session)
    s.sendto(header, (host, port))

    # If the thread is still running, wait until it completes
    while (threadRunning):
        time.sleep(0.5);

    # Close Client Session
    s.close()
    exit()

def main():
    global timeToDie
    global serverDidntRespond

    # Header Arguments
    magic = 50273
    version = 1
    sequence = 0
    session = random.randint(0, 4294967295)

    # Check User Argments
    if (len(sys.argv) != 3):
        print("Usage: python client <hostname> <portname>");
        sys.exit();

    # Set up socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    # Set up host, port variables using input arguments
    host = sys.argv[1]
    port = int(sys.argv[2])

    # Set up thread to receive incoming messages from server
    receiveReply = threading.Thread(target=process, args=(s, port))
    receiveReply.start()

    # Send server hello message to start session
    header = struct.pack('!HBBLL', magic, version, 0, sequence, session);
    s.sendto(header, (host, port));
    serverDidntRespond = True

    # Read Client Input Messages
    while True:
        try:
            # Reading thread reads a Goodbye message from server
            if timeToDie:
                break

            # Read user input
            userinput, _, _ = select.select([sys.stdin], [], [], 3)
            if userinput:
                message = sys.stdin.readline()
                if message == "":
                    break
                message = message[:-1] # Remove new line from end of line

                # Client terminate code
                if (message == "q"):
                    print "GOODBYE from client."
                    break

                sequence += 1   # Increment sequence number

                # Send server user message
                header = struct.pack('!HBBLL', magic, version, 1, sequence, session);
                s.sendto(header + message, (host, port));
                serverDidntRespond = True

        # EOF reached. Terminate
        except EOFError:
            print "GOODBYE from EOF"
            break

        # Client Pressed ctrl-d. Terminate
        except KeyboardInterrupt:
            print "GOODBYE from client."
            break

    # EOF from stdin read. Proceed to close session
    terminate(magic, version, sequence, session, s, host, port);

if __name__ == "__main__":
    main()
