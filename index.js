const express= require("express");
const path= require('path');
const http= require('http');
const socketio = require('socket.io');
const formatMessage=require('./util/message');
const {userJoin, getCurrentUser,userLeave,getRoomUsers}=require('./util/user');


const app= express();
const server = http.createServer(app);
const io= socketio(server)
const botName= 'ChatCord Bot';


//set static folder
const public= path.join(__dirname,'public')

app.use(express.static(public))




//Run when client connects
io.on('connection', socket=>{

    
    socket.on('joinRoom',({username, room})=>{

        const user= userJoin(socket.id,username, room)

     socket.join(user.room);

    
    // Welcome current user
     socket.emit("message",formatMessage(botName,"Welcome to ChatCord!🥰"));

     // Broadcast when a user connects
     socket.broadcast.to(user.room).emit(
        'message', formatMessage(botName,`$(user.username) has joined the chat😊`));
    });
   
    //listen  for chat message
     socket.on('chatMessage', (msg)=>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username,msg));
     });
    //Run when client disconnects
    socket.on('dissconnect',() => {
        const user = userLeave(socket.id);
        if(user){
        io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat😟`));
        }
  });

  
});

server.listen(process.env.PORT || 3000, function(){
    console.log("Server is running on port" +(process.env.PORT || 3000)+'🥰🥰🥰')
})