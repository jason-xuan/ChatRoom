export class User {
    private _roomname: string;

    constructor(
        public readonly name: string,
        public readonly socketId: string
    ) {}

    get roomname(): string {
        return this._roomname;
    }

    set roomname(room: string) {
        this._roomname = room;
    }

}
