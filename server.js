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

// </>

if(show_users_typing)
    var users_typing = [];

app.use(express.static(__dirname + '/client'));
server.listen(port, () => console.log('Server ready! Listening on port ' + port));

console.log('\n\nSettings : ');
if(log_chat) { console.log('> [ENABLED] Chat logging'); }
else { console.log('> [DISABLED] Chat logging'); }
if(show_users_typing) { console.log('> [ENABLED] Show users typing'); }
else { console.log('> [DISABLED] Show users typing'); }
if(dynamic_message_background_colors) { console.log('> [ENABLED] Dynamic message background colors'); }
else { console.log('> [DISABLED] Dynamic message background colors'); }
console.log('--> Change options in server.js\n\n\n');

function onConnection(sock) {
    console.log('User connected... Waiting for nickname (' + sock.id + ')');

    io.emit('settings', { showUsersTyping: show_users_typing, DynamicMessageBGColors: dynamic_message_background_colors });

    sock.on('msg', (txt) => {
        if(sock.nickname == null) {
            sock.disconnect();
        }
        io.emit('msg', txt, sock.nickname);
        if(log_chat) { console.log(sock.nickname + ' : ' + txt); }
    });

    sock.on('set nickname', (nickname) => {
        sock.nickname = nickname;
        io.emit('servermsg', sock.nickname + ' has joined the chat.');
        console.log(sock.id + ' -> ' + sock.nickname);
    });

    if(show_users_typing) {

        sock.on('user typing', (data) => {
            if(data) {
                console.log(sock.nickname + ' is typing');
                users_typing.push(sock);
            } else {
                console.log(sock.nickname + ' stopped typing');
                remove_array_element(users_typing, sock);
            }
        });

        setInterval(function() {
            if(users_typing.length <= 0) {
                io.emit('user_typing_func', false);
            } else {
                var users_typing_nicknames = [];
                users_typing.forEach(function(element) {
                    users_typing_nicknames.push(element.nickname);
                }, this);
                io.emit('user_typing_func', { isTyping: true, users: users_typing_nicknames});
            }
        }, 1000);

    }    

    sock.on('disconnect', () => {
        if(sock.nickname != null) { console.log(sock.nickname + ' diconnected.'); }
        else { console.log(sock.id + ' disconnected'); }

        if(show_users_typing) {
            remove_array_element(users_typing, sock);
            if(sock.nickname != null)
                io.emit('servermsg', sock.nickname + ' left the chat.');
        }
    });

}

function remove_array_element(array, element) {
    var i = array.indexOf(element);
    if(i != -1) {
        array.splice(i, 1);
    }
}