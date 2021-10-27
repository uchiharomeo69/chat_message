export type User = {
  clientId: string;
  _id: string;
  room?: string[];
};

class UsersOnline {
  private listUsersOnline: User[];
  constructor() {
    this.listUsersOnline = [];
  }

  getAll() {
    return this.listUsersOnline;
  }
  getUser(_id: string) {
    return this.listUsersOnline.filter((e) => e._id === _id);
  }

  getByClient(clientId): User {
    return this.listUsersOnline.find((e) => e.clientId === clientId);
  }
  pushRoom(clientId: string, channelId: string) {
    let user: User = this.getByClient(clientId);
    if (!user) return;
    if (!user.room) user.room = [];
    user.room.push(channelId);
  }

  totalMember(_id, channelId) {
    let listMember = this.listUsersOnline.filter(
      (e) => e?.room?.includes(channelId) && e._id !== _id,
    );

    return listMember.length;
  }

  addUser(user: User) {
    return this.listUsersOnline.push(user);
  }
  removeUser(clientId: string) {
    this.listUsersOnline = this.listUsersOnline.filter(
      (e) => e.clientId !== clientId,
    );
  }
}

export default new UsersOnline();
