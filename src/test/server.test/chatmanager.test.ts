import {ChatManager} from "../../src/server/chatmanager";
import {User} from "../../src/model";


describe('test log in', () => {
    let manager :ChatManager;
    let socketId = 'mock socket id';
    let user: User;

    beforeEach(() => {
        manager = new ChatManager();
        user = new User('jason', socketId);
    });

    test('test user login', () => {
        manager.login(user);
        let user_by_id = manager.getUserByID(socketId);
        expect(user_by_id.roomname).toBe('public hall');
    });
});

describe('test user logout', () => {
    let manager :ChatManager;
    let user: User;

    beforeEach(() => {
        manager = new ChatManager();
        user = new User('jason', 'mock socket id');
    });

    test('test user logout successfully', () => {
        expect(manager.hasUserId(user.socketId)).toBeFalsy();
        manager.login(user);
        expect(manager.hasUserId(user.socketId)).toBeTruthy();
        expect(manager.hasUserId('fake')).toBeFalsy();

        manager.logout(user);
        expect(manager.hasUserId(user.socketId)).toBeFalsy();
        expect(manager.hasUserName(user.name)).toBeFalsy();
    });
});

describe('test displaying information', () => {
    let manager :ChatManager;
    let user: User, jessy: User, ben: User, fray: User;

    beforeEach(() => {
        manager = new ChatManager();
        user = new User('jason', 'mock socket id');
        jessy = new User('jessy', '1231224');
        ben = new User('ben', '13432532');
        fray = new User('fray', '2149730742');
    });

    test('tell if user exist', () => {
        expect(manager.hasUserId(user.socketId)).toBeFalsy();
        expect(manager.hasUserName(user.name)).toBeFalsy();
        manager.login(user);
        expect(manager.hasUserId(user.socketId)).toBeTruthy();
        expect(manager.hasUserName(user.name)).toBeTruthy();
        expect(manager.hasUserId('fake')).toBeFalsy();
        expect(manager.hasUserName('fake name')).toBeFalsy();
    });

    test('test display users', () => {
        expect(manager.usersInRoom('public hall')).toHaveLength(0);
        expect(manager.login(user)).toBeTruthy();
        expect(manager.usersInRoom('public hall')).toContain(user);

        expect(manager.usersInRoom('public hall')).toHaveLength(1);
        expect(manager.login(jessy)).toBeTruthy();
        expect(manager.usersInRoom('public hall')).toContain(user);
        expect(manager.usersInRoom('public hall')).toContain(jessy);

        expect(manager.usersInRoom('public hall')).toHaveLength(2);
        expect(manager.login(ben)).toBeTruthy();
        expect(manager.usersInRoom('public hall')).toContain(user);
        expect(manager.usersInRoom('public hall')).toContain(jessy);
        expect(manager.usersInRoom('public hall')).toContain(ben);

        expect(manager.usersInRoom('public hall')).toHaveLength(3);
        expect(manager.login(fray)).toBeTruthy();
        expect(manager.usersInRoom('public hall')).toContain(user);
        expect(manager.usersInRoom('public hall')).toContain(jessy);
        expect(manager.usersInRoom('public hall')).toContain(ben);
        expect(manager.usersInRoom('public hall')).toContain(fray);

        expect(manager.usersInRoom('public hall')).toHaveLength(4);
        manager.logout(fray);
        expect(manager.usersInRoom('public hall')).toContain(user);
        expect(manager.usersInRoom('public hall')).toContain(jessy);
        expect(manager.usersInRoom('public hall')).toContain(ben);
        expect(manager.usersInRoom('public hall')).toHaveLength(3);
    });
});

describe('test chat room', () => {
    let manager :ChatManager;
    let user: User;

    beforeEach(() => {
        manager = new ChatManager();
        user = new User('jason', 'mock socket id');
    });

    test('test create room', () => {
        manager.addRoom(user, 'room');
        let room = manager.rooms['room'];
        expect(room.name).toEqual('room');
        expect(room.admin).toBe(user);
    });

    test('test switch room', () => {
        manager.login(user);
        manager.addRoom(user, 'room');

        expect(user.roomname).toEqual('public hall');
        expect(manager.rooms['public hall'].users).toContain(user);
        expect(manager.rooms['room'].users).toHaveLength(0);

        manager.switchRoom(user, 'room');

        // user's room name changed
        expect(user.roomname).toEqual('room');
        // new room contains user
        expect(manager.rooms['room'].users).toContain(user);
        // old room doesn't contain user
        expect(manager.rooms['public hall'].users).toHaveLength(0);
    });
});

describe('Test admin privilege', () => {
    let manager :ChatManager;
    let user: User, fray: User;

    beforeEach(() => {
        manager = new ChatManager();
        user = new User('jason', 'mock socket id');
        fray = new User('fray', '2149730742');
    });

    test('test ban user', () => {
        expect(manager.login(user)).toBeTruthy();
        expect(manager.login(fray)).toBeTruthy();
        expect(manager.addRoom(user, 'room')).toBeTruthy();
        // before ban, fray can get in room
        expect(manager.switchRoom(fray, 'room')).toBeTruthy();
        expect(manager.switchRoom(fray, 'public hall')).toBeTruthy();
        // ban fray
        expect(manager.banUser(user, fray, 'room')).toBeTruthy();
        // fray could not enter room
        expect(manager.switchRoom(fray, 'room')).toBeFalsy();
        expect(manager.usersInRoom('public hall')).toContain(fray);
        expect(manager.usersInRoom('room')).toEqual([]);
        expect(manager.usersInRoom('room')).toHaveLength(0);
    });

    test('test kick user out', () => {
        expect(manager.login(user)).toBeTruthy();
        expect(manager.login(fray)).toBeTruthy();
        expect(manager.addRoom(user, 'room')).toBeTruthy();
        expect(manager.switchRoom(fray, 'room')).toBeTruthy();

        expect(manager.kickUserOut(user, fray, 'room')).toBeTruthy();

        expect(manager.usersInRoom('public hall')).toContain(fray);
        expect(manager.usersInRoom('room')).toEqual([]);
        expect(manager.usersInRoom('room')).toHaveLength(0);
    });
});

describe('test private room(with password)', () => {
    let manager: ChatManager;
    let user: User;
    let fray: User;
    let passwd = 'password';

    beforeEach(() => {
        manager = new ChatManager();
        user = new User('jason', 'mock socket id');
        fray = new User('fray', 'another socket id');
        manager.login(user);
        manager.login(fray);
    });

    test('test create private room', () => {
        expect(manager.addPrivateRoom(user, 'room', passwd)).toBeTruthy();
        expect(manager.privateRooms['room']).toBeDefined();
    });

    test('test join private room', () => {
        expect(manager.addPrivateRoom(user, 'room', passwd)).toBeTruthy();
        expect(manager.switchPrivateRoom(fray, 'room', passwd)).toBeTruthy();
        expect(manager.usersInRoom('room')).toContain(fray);
    });
});
