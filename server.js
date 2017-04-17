/*

// TODO:
- More rooms
- Improve colors
- Language filter
- Chat history (~ 10 messages)

*/

'use strict';

let http = require('http');
let express = require('express');
let socketio = require('socket.io');

let app = express();
let server = http.createServer(app);
let io = socketio(server);

io.on('connection', onConnection);

// Change to your liking

    // Port to listen to
    var port = 8080;

    // Logs chat into console
    var log_chat = true;

    // Shows who is typing
    var show_users_typing = true;

    // Keep background color if same user types multiple lines of messages;
    // Changes color only when new user types a message
    var dynamic_message_background_colors = true;

    // Show who is currently active
    var show_active_users = true;

// </>

// < create arrays >
if(show_users_typing)
    var users_typing = [];

var active_users = [];
// </ create arrays >

app.use(express.static(__dirname + '/client'));
server.listen(port, () => console.log('Server ready! Listening on port ' + port));

// Log the settings into the console
console.log('\n\nSettings : ');
if(log_chat) { console.log('> [ENABLED] Chat logging'); }
else { console.log('> [DISABLED] Chat logging'); }
if(show_users_typing) { console.log('> [ENABLED] Show users typing'); }
else { console.log('> [DISABLED] Show users typing'); }
if(dynamic_message_background_colors) { console.log('> [ENABLED] Dynamic message background colors'); }
else { console.log('> [DISABLED] Dynamic message background colors'); }
console.log('--> Change options in server.js\n\n\n');

// When a new user connects
function onConnection(sock) {
    console.log('User connected... Waiting for nickname (' + sock.id + ')');

    // Send settings to the user
    io.emit('settings', { showUsersTyping: show_users_typing, DynamicMessageBGColors: dynamic_message_background_colors, showActiveUsers: show_active_users });

    // Executes when a user sends a message
    sock.on('msg', (txt) => {
        // If the user did not choose a nickname, disconnect him
        if(sock.nickname == null) {
            sock.disconnect();
        }
        // Send the message to every other user
        io.emit('msg', txt, sock.nickname);
        // Log the message if enabled
        if(log_chat) { console.log(sock.nickname + ' : ' + txt); }
    });

    // Check for duplicate nicknames
    sock.on('check_nickname', (nickname) => {
        var found_dupe = false;
        active_users.forEach(function(element) {
            if(element == nickname) {
                found_dupe = true;
                return;
            }
        }, this);

        // Check if a duplicate was found and tell user the response
        if(found_dupe) {
            io.sockets.connected[sock.id].emit('nickname_check_response', { avalible: false });
        } else {
            io.sockets.connected[sock.id].emit('nickname_check_response', { avalible: true, nickname: nickname });
        }
    });

    // Executes when a user sets his nickname
    sock.on('set nickname', (nickname) => {
        // Set the nickname
        sock.nickname = nickname;
        // Tell users a new user joined
        io.emit('servermsg', sock.nickname + ' has joined the chat.');
        // Add this user into the active users array
        active_users.push(sock.nickname);
        if(show_active_users) {
            // Tell users everyone who is active
            emit_active_users();
        }
    });

    // If show users typing is enabled execute the following code
    if(show_users_typing) {

        // When a user starts or stops typing
        sock.on('user typing', (data) => {
            // If he started typing
            if(data) {
                // Log who is typing
                console.log(sock.nickname + ' is typing');
                // Add the user to the array of currently typing users
                users_typing.push(sock);
                
            // If he stopped typing
            } else {
                // Log who stopped typing
                console.log(sock.nickname + ' stopped typing');
                // Run function to tell who stopped typing
                remove_array_element(users_typing, sock);
            }
        });

        // Check who is typing every x miliseconds
        setInterval(function() {
            // If the array is empty no one is typing
            if(users_typing.length <= 0) {
                // Tell users that no one is typing
                io.emit('user_typing_func', false);

            // If the array is not empty, someone is typing
            } else {
                // Create an array of nicknames
                var users_typing_nicknames = [];
                // Retrrieve nicknames from array
                users_typing.forEach(function(element) {
                    // Add nicknames top array
                    users_typing_nicknames.push(element.nickname);
                }, this);
                // Send JSON of users typing
                io.emit('user_typing_func', { isTyping: true, users: users_typing_nicknames});
            }
        }, 1000);

    }    

    // Executes when a user disconnects
    sock.on('disconnect', () => {
        // If the nickname is set, log the nickname that disconnected
        if(sock.nickname != null) { console.log(sock.nickname + ' diconnected.'); }
        // else, log the id that disconnect
        else { console.log(sock.id + ' disconnected'); }

        // Remove this user from the list
        remove_array_element(active_users, sock.nickname);
        // Tell users everyone who is active
        emit_active_users();

        // If the option is enabled, remove the user from the array
        if(show_users_typing) {
            // Remove from array
            remove_array_element(users_typing, sock);
            // If nickname is set, tell users who left the chat;
            // Avoids "undefined"
            if(sock.nickname != null)
                io.emit('servermsg', sock.nickname + ' left the chat.');
        }
    });

}

// Tell users who is currently active
function emit_active_users() {
    io.emit('active users', active_users);
}

// Remove an element from an array
function remove_array_element(array, element) {
    var i = array.indexOf(element);
    if(i != -1) {
        array.splice(i, 1);
    }
}