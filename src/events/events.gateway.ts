import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'chat' })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() public server: Server;

  @SubscribeMessage('events')
  handleTest(
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: string,
  ) {
    socket.emit('message', { username: socket.id, message });
    // socket.broadcast.emit('message', { username: socket.id, message });
    return { username: socket.id, message };
  }

  afterInit(server: Server) {
    this.server.on('create-room', (room) => {
      console.log(`"Room:${room}"이 생성되었습니다.`);
    });

    this.server.on('join-room', (room, id) => {
      console.log(`"Socket:${id}"이 "Room:${room}"에 참여하였습니다.`);
    });

    this.server.on('leave-room', (room, id) => {
      console.log(`"Socket:${id}"이 "Room:${room}"에서 나갔습니다.`);
    });

    this.server.on('delete-room', (roomName) => {
      console.log(`"Room:${roomName}"이 삭제되었습니다.`);
    });

    console.log('웹소켓 서버 초기화 ✅');
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(`${socket.id} 소켓 연결`);

    socket.broadcast.emit('message', {
      message: `${socket.id}가 들어왔습니다.`,
    });
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log(`${socket.id} 소켓 연결 해제 ❌`);
  }
}
