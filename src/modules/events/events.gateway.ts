import {
  BadRequestException,
  Logger,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { JwtAuthGuard } from '../auth/auth.guard';
import { ChatService } from '../chat/chat.service';
import {
  CreateChatDto,
  GetUserChatsDto,
  SendMessageDto,
  UserTypingDto,
} from '../chat/dto/index';
import { ChatRoom } from '../chat/entities/chat-room.entity';
import { Message } from '../chat/entities/message.entity';
import { UsersService } from '../users/users.service';

type SocketWithAuth = {
  userId: string;
} & Socket;

UseGuards(JwtAuthGuard);
@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly Logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  afterInit(server: Server): void {
    this.Logger.log('WebSocket server initialized');

    server.use(async (socket: SocketWithAuth, next) => {
      try {
        const token = socket.handshake.auth.token as string;

        if (!token) {
          next(new UnauthorizedException('No token provided'));
        }

        const { id: userId } = this.jwtService.decode(token);

        if (!userId) {
          next(new UnauthorizedException('Invalid token'));
        }

        const user = await this.userService.getUserById(userId);

        if (!user) {
          next(new BadRequestException("User doesn't exist!"));
        }

        socket.userId = userId;
        next();
      } catch (error) {
        next(new UnauthorizedException('Token verification failed'));
      }
    });
  }

  async handleConnection(client: SocketWithAuth): Promise<void> {
    this.Logger.log(`Client connected: ${client.userId}`);

    const userChats = await this.chatService.getUserChats(client.userId);

    if (userChats) {
      userChats.forEach((chat) => client.join(chat.id));
    }
  }

  handleDisconnect(client: Socket): void {
    this.Logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('getUserChats')
  async handleGetUserChats(client: SocketWithAuth): Promise<GetUserChatsDto[]> {
    const userId = client.userId;
    const userChats = await this.chatService.getUserChats(userId);

    client.emit('userChats', userChats);

    return userChats;
  }

  @SubscribeMessage('createChat')
  async handleCreateChat(
    client: SocketWithAuth,
    createChatDto: CreateChatDto,
  ): Promise<ChatRoom> {
    const chatRoom = await this.chatService.createChat(
      client.userId,
      createChatDto,
    );

    chatRoom.participants.forEach((participant) => client.join(participant.id));

    this.server.to(chatRoom.id).emit('newChat', chatRoom);

    return chatRoom;
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: SocketWithAuth,
    sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    const message = await this.chatService.sendMessage(
      client.userId,
      sendMessageDto,
    );

    this.server.to(message.chatRoom.id).emit('newMessage', message);

    return message;
  }

  @SubscribeMessage('userTyping')
  async handleUserTyping(
    client: SocketWithAuth,
    userTypingDto: UserTypingDto,
  ): Promise<void> {
    userTypingDto.userId = client.userId;
    this.server.to(userTypingDto.chatId).emit('userTyping', userTypingDto);
  }

  @SubscribeMessage('markMessageAsRead')
  async handleMarkMessageAsRead(
    client: SocketWithAuth,
    data: { chatId: string },
  ): Promise<void> {
    const { chatId } = data;

    await this.chatService.markMessageAsRead(client.userId, chatId);
  }

  @SubscribeMessage('countUnreadMessages')
  async handleCountUnreadMessages(
    client: SocketWithAuth,
    data: { chatId: string },
  ): Promise<number> {
    const { chatId } = data;
    const count = await this.chatService.countUnreadMessages(
      client.userId,
      chatId,
    );

    client.emit('unreadMessageCount', { chatId, count });

    return count;
  }
}
