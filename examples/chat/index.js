// Setup basic express server
var express = require('express.io');
var app = express();
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;
var fs = require('fs');
var emoji = require('emoji');
var file;
var id_aluno;
var room;
var projeto;
var tipo;

server.listen(port, function () {
   console.log('Server listening at port %d', port);
});

// Routing

  app.use(express.static(__dirname + '/public'));
app.get('/aluno/:projeto/:aluno/:room', function(req, res) {
  room = req.params.room;
  id_aluno = req.params.aluno;
  projeto = req.params.projeto;
  tipo = 'aluno';
  res.redirect('/index2.html');
});

app.get('/adm/:projeto/:usuario/:room', function(req, res) {
  room = req.params.room;
 id_aluno = req.params.usuario;
  projeto = req.params.projeto;
  tipo = 'professor';
  res.redirect('/');
});

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
var numMessage = 0;
io.on('connection', function (socket) {
  var addedUser = false;
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    file = projeto+"_"+socket.room+".json";
    //when the client emits 'new message', this save te message in a log
    var date = new Date();
    var obj = {idMensagem: data.idMensagem,room: socket.room ,username: socket.username,idUsuario: socket.id_aluno,data_criacao: date,message: data.mensagem}
    obj = JSON.stringify(obj);
        fs.appendFile(file,obj, function() {
                });
    // we tell the client to execute 'new message'    
    socket.broadcast.to(socket.room).emit('new message', {
      idMensagem: data.idMensagem,
      username: socket.username,
      idUsuario: socket.id_aluno,
      room: socket.room,
      message: data.mensagem
    });
  });

  socket.on('set session', function (){
    socket.id_aluno = id_aluno;
    socket.room = room;
    socket.join(room);
    io.to(socket.id).emit('get session', {
      id_aluno: id_aluno,
      room: room
    });
  });

 socket.on('delete message', function (idMensagem){
  console.log('entrou aqui server');
   socket.broadcast.to(socket.room).emit('delete message', idMensagem);
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client    
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.to(socket.room).emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });


  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.to(socket.room).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.to(socket.room).emit('stop typing', {
      username: socket.username
    });
  });

  //   var dateagr = Date.now();
  //   var datareoload = 1448996679373;
  // if (dateagr >= datareoload) {
  //   console.log('hey');
  //   io.sockets.emit('reload');
  // };

  // when the user disconnects.. perform this
  socket.on('disconnect student', function () {
    // remove the username from global usernames list
    if (addedUser) {
      // emits the reload action
      io.sockets.emit('reload', 'todos');
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

  socket.on('ban student', function (id) {
    // remove the username from global usernames list
    if (addedUser) {
      // emits the reload action
      io.sockets.emit('reload', id);
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
