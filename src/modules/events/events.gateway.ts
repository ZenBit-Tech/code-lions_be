import { Logger, UseGuards } from '@nestjs/common';
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
import { CreateChatDto } from '../chat/dto/create-chat.dto';
import { SendMessageDto } from '../chat/dto/send-message.dto';
import { UserTypingDto } from '../chat/dto/user-typing.dto';
import { ChatRoom } from '../chat/entities/chat-room.entity';
import { Message } from '../chat/entities/message.entity';

UseGuards(JwtAuthGuard);
@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly Logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  afterInit(): void {
    this.Logger.log('WebSocket server initialized');
  }

  handleConnection(client: Socket): void {
    this.Logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.Logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createChat')
  async handleCreateChat(
    client: Socket,
    createChatDto: CreateChatDto,
  ): Promise<ChatRoom> {
    const chatRoom = await this.chatService.createChat(createChatDto);

    chatRoom.participants.forEach((participant) => client.join(participant.id));

    this.server.to(chatRoom.id).emit('newChat', chatRoom);

    this.server.emit('Chat created', createChatDto);

    return chatRoom;
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    const message = await this.chatService.sendMessage(sendMessageDto);

    this.server.to(message.chatRoom.id).emit('newMessage', message);

    return message;
  }

  @SubscribeMessage('userTyping')
  async handleUserTyping(
    client: Socket,
    userTypingDto: UserTypingDto,
  ): Promise<void> {
    this.server.to(userTypingDto.chatId).emit('userTyping', userTypingDto);
  }
}
