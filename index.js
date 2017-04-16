/*var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var nsp = io.of('/official');

io.on('connection', function(socket) {
  console.log('A user connected!');
});

/*
nsp.on('connection', function(socket){
  console.log('a user connected');

  //change_chat_room('general');
  // Join general room
  socket.join('general');
  console.log('Joined general');
  // Leave general room
  socket.leave('general');
  // Join Secondary Room
  socket.join('secondary');
  console.log('Joined secondary');

  // Test send to general
  nsp.to('general').emit('test');
  // Test send to secondary
  nsp.to('secondary').emit('test1');

  nsp.emit('user connected', 'A user has joined the chat room!');
  socket.on('disconnect', function(){
    console.log('user disconnected');
    nsp.emit('user disconnected', 'A user has left the chat room!');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    nsp.emit('chat message', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
*/