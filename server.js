const express = require('express')
const app=express();
const http=require('http');
const {Server} = require('socket.io');
const cors = require('cors');

const server = http.createServer(app);
const io= new Server(server);

const SocketUserMap={};
var RoomUserMap={};
var RoomMsgsMap={};


app.use(cors());

function getConnectedUsers(roomId){
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
      return {
          username:SocketUserMap[socketId],
      };
  } );
}   


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', ( identity, room ) => {
    console.log(`User ${identity} joined room ${room}`);
    SocketUserMap[socket.id] = identity;
    socket.join(room);
    // if(!RoomUserMap[room])
    //   {
    // RoomUserMap[room]=new Array(identity);}
    // else{
    //   RoomUserMap[room].push(identity);
    // }
    // io.to(room).emit('message', { type: 'join', sender: RoomUserMap[room] });
    // console.table(RoomUserMap);
    const users=getConnectedUsers(room);
    io.to(room).emit('message', { type: 'join', sender: users });
    io.to(room).emit('message', { type: 'msg', text:RoomMsgsMap[room] });
  });

  socket.on('sendMessage', ( identity, room, text ) => {
    console.log(`User ${identity} sent message in room ${room}: ${text}`);
    if(!RoomMsgsMap[room])
      {
    RoomMsgsMap[room]=new Array({'sender':identity,'text':text});}
    else{
      RoomMsgsMap[room].push({'sender':identity,'text':text});
    }
    // RoomMsgsMap[room].push({'sender':identity,'text':text});
    io.to(room).emit('message', { type: 'msg', text:RoomMsgsMap[room] });
    console.table(RoomMsgsMap);
  });

  socket.on('disconnecting', () => {
    console.log('A user disconnected');
    const rooms= [...socket.rooms];
    console.table(rooms);
        rooms.forEach((roomId) => {
          console.log(`${roomId}`)
          socket.in(roomId).emit('disconnected',
          {
              socketId:socket.id,
              username:SocketUserMap[socket.id],
          })
      });
    delete SocketUserMap[socket.id];
    socket.leave();
  });
});

const port = process.env.PORT || 3000;
io.listen(port);
console.log(`Socket server running on port ${port}`);
