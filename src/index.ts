import ChatServer from './chatserver';
import router from './router/router';

import socketIo = require("socket.io");
import path = require("path");
const chatServer = new ChatServer(8080);

const io = socketIo().listen(chatServer.server);

chatServer.setRouter(router);
chatServer.setStaticPath(path.join(__dirname, 'frontend'));
chatServer.setStaticPath(path.join(__dirname, 'static'));

chatServer.socket.on('connection', (socket: socketIo.Socket) => {
    console.log("Socket established");
    socket.on('message', (message : string)=>{
        console.log(message);
        io.emit('messageFromServer', {message});
    })
});

chatServer.start();
