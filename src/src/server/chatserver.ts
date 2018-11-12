import * as express from 'express';
import {Router, Application} from 'express';
import {Server as HttpSercer , createServer} from "http";
import {Socket} from 'socket.io';
import * as  SocketIO from 'socket.io'
import * as path from 'path';


import router from '../router/router';
import {User, ChatRoom, Message} from '../model/index'
import {ChatManager} from "./chatmanager";


export class ChatServer {
    private readonly app : Application;
    private readonly server: HttpSercer;
    private readonly chat: ChatManager;

    constructor(private port: number) {
        this.app = express();
        this.server = createServer(this.app);
        this.chat = new ChatManager();
        this.initSocket();
        this.configre();
    }

    start() {
        // this._app.listen(this.port, callback);
        this.server.listen(this.port);
    }

    get express_app(): Application {
        return this.app;
    }

    private configre() {
        this.setRouter(router);
        this.setStaticPath(path.join(__dirname, '..', 'frontend'));
        this.setStaticPath(path.join(__dirname, '..', '..', '..', 'static'));
    }

    private initSocket() {
        let io = SocketIO().listen(this.server);
        io.sockets.on('connection', (socket: Socket) => {
            console.log("A new Socket established");

            socket.on('message', (message : Message) => {
                let user = this.chat.getUserByID(socket.id);
                io.sockets.to(user.roomname).emit('message', message);
            });

            socket.on('addUser',(username : string) => {
                let user = new User(username, socket.id);
                this.chat.addNewUser(user);
                console.log("welcome: " + username);
                socket.join(user.roomname);
                // the event will only be broadcast to clients that have joined the given room
                // (the socket itself being *excluded*).
                socket.broadcast.to(user.roomname).emit("userIn", user.name);
                // the event will only be broadcast to clients that have joined the given room
                // (the socket itself being *excluded*).
                // broadcast current users in the room
                socket.to(user.roomname).emit('currentUsers', this.chat.usersInRoom(user.roomname));
                socket.emit('currentUsers', this.chat.usersInRoom(user.roomname));
            });

            socket.on('switchRoom', (roomname: string) => {
                let user = this.chat.getUserByID(socket.id);
                let oldroom = user.roomname;
                // if successfully update data
                if (this.chat.switchRoom(user, roomname)) {
                    socket.join(user.roomname);
                    socket.broadcast.to(user.roomname).emit("userIn", user.name);
                    socket.broadcast.to(oldroom).emit("userOut", user.name);
                }
                else {
                    socket.emit('system', 'room name invalid');
                }
            });

            socket.on('addRoom', (roomname: string) => {
                let user = this.chat.getUserByID(socket.id);
                this.chat.addRoom(user, roomname);
                socket.emit("updateRooms", this.chat.getRooms());
                socket.broadcast.emit("updateRooms", this.chat.getRooms());
            });
        });
    }

    setRouter(router: Router) {
        this.app.use(router);
    }

    setStaticPath(path: string) {
        this.app.use(express.static(path));
    }

}
