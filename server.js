'use strict';

let http = require('http');
let express = require('express');
let socketio = require('socket.io');

let app = express();
let server = http.createServer(app);
let io = socketio(server);

io.on('connection', onConnection);

// Change to your liking
var port = 8080;
var log_chat = true;

app.use(express.static(__dirname + '/client'));
server.listen(port, () => console.log('Server ready! Listening on port ' + port));
if(log_chat) { console.log('Chat logging enabled! Change option in server.js'); }

function onConnection(sock) {
    console.log('User connected... Waiting for nickname (' + sock.id + ')');

    //sock.emit('servermsg', 'A new user connected!');
    sock.on('msg', (txt) => {
        io.emit('msg', txt, sock.nickname);
        if(log_chat) { console.log(sock.nickname + ' : ' + txt); }
    });

    sock.on('set nickname', (nickname) => {
        sock.nickname = nickname;
        io.emit('servermsg', sock.nickname + ' has joined the chat. Say hi!');
        console.log(sock.id + ' -> ' + sock.nickname);
    });

    sock.on('disconnect', () => {
        if(sock.nickname != null) { console.log(sock.nickname + ' diconnected'); }
        else { console.log(sock.id + ' disconnected'); }
        
        io.emit('servermsg', sock.nickname + ' left the chat.');
    });

}