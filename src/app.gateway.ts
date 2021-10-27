import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { HttpService } from '@nestjs/axios';
import UserOnline from './listContact/listContact';
import { lastValueFrom } from 'rxjs';

@WebSocketGateway(8081, { transports: ['websocket'] })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private httpService: HttpService) {}
  handleDisconnect(client: any) {
    const user = UserOnline.getByClient(client.id);

    if (!user?.room) {
      UserOnline.removeUser(client.id);
      return;
    }

    user?.room.forEach((element) => {
      client.to(element).emit('someoneOnline', {
        channelId: element,
        userId: user._id,
        name: 'sub',
      });
    });
    UserOnline.removeUser(client.id);
  }
  handleConnection(client: Socket) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('connectServer')
  connect(client: Socket, payload: any) {
    UserOnline.addUser({ _id: payload, clientId: client.id });
    return { message: 'thanh cong cmnr' };
  }

  @SubscribeMessage('join')
  join(client: Socket, payload: any) {
    const { _id, channelId } = payload.conversation;
    client.join(channelId);
    UserOnline.pushRoom(client.id, channelId);

    client.to(channelId).emit('someoneOnline', {
      channelId: channelId,
      userId: UserOnline.getByClient(client.id)?._id,
      name: 'add',
    });

    return UserOnline.totalMember(
      UserOnline.getByClient(client.id)?._id,
      channelId,
    );
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(client: Socket, payload: any) {
    const { conversation, content, token } = payload;

    // tao conversation
    if (!conversation?.conversation?._id) {
      const createContact$ = await this.httpService.post(
        `${process.env.GATEWAY_URL}/conversation/direct`,
        {
          userId: conversation?.userId,
          userId2: conversation?.userId2,
          nickName: conversation?.nickName,
          nickName2: conversation?.nickName2,
          type: conversation.conversation.type,
          content,
        },
        {
          headers: {
            'x-access-token': token,
          },
        },
      );
      const res = await lastValueFrom(createContact$);
      const data = res?.data?.data;

      const users = UserOnline.getUser(conversation?.userId2);
      users.forEach((element) => {
        this.server
          .to(element.clientId)
          .emit('someoneConnect', { conversation: data.conversation2 });
      });
      return { conversation: data.conversation1 };
    }

    // data co conversation k can tao nua
    const message$ = await this.httpService.post(
      `${process.env.GATEWAY_URL}/message`,
      {
        conversationId: conversation?.conversation._id,
        senderId: conversation.userId,
        content,
      },
      {
        headers: {
          'x-access-token': token,
        },
      },
    );
    const message: any = await lastValueFrom(message$);
    message.data.data.nickName = payload.conversation.nickName;
    this.server
      .in(payload.conversation.conversation.channelId)
      .emit('getMessage', { message: message.data.data });
  }

  @SubscribeMessage('call')
  async call(client: Socket, payload: any) {
    const { user, channelId, video } = payload;
    client.to(channelId).emit('someoneCall', { user, channelId, video });
  }

  //

  @SubscribeMessage('calloff')
  async calloff(client: Socket, payload: any) {
    const { channelId } = payload;
    this.server.to(channelId).emit('serveroffcall', { channelId });
  }

  // join popout vao channel de khi tu choi se nhan dc message
  @SubscribeMessage('callpopout')
  async callpopout(client: Socket, payload: any) {
    client.join(payload.channelId);
  }

  // ng nhan dong y cuoc goi
  @SubscribeMessage('acceptCall')
  async acceptCall(client: Socket, payload: any) {
    const { channelId, _id } = payload;
    this.server
      .to(channelId)
      .emit('friendAcceptCall', { friendId: channelId + '' + _id });
  }

  @SubscribeMessage('joincallroom')
  async joincallroom(client: Socket, payload: any) {
    const { room, _id } = payload;
    console.log(this.server.sockets.adapter.rooms[room]);

    client.join(room);
    console.log('room', room);

    client.to(payload.room).emit('sharecall', { friendId: room + '' + _id });
  }
}
