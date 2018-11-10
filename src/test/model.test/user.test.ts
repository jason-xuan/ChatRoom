import {User} from "../../src/model";


test('test create user', () => {
   let user = new User('jason', 'mock socket id');
   expect(user.name).toEqual('jason');
   expect(user.socketId).toEqual('mock socket id');
   expect(user.roomname).toBeNull();
});

test('test change room', () => {
    let user = new User('jason', 'mock socket id');
    user.roomname = 'hall';
    expect(user.roomname).toEqual('hall');
    user.roomname = 'another hall';
    expect(user.roomname).toEqual('another hall');
});
