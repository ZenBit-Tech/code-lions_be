import {
  BadRequestException,
  forwardRef,
  Inject,
  Logger,
  UnauthorizedException,
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
import { Errors } from 'src/common/errors';
import { Type } from 'src/modules/notifications/entities/notification-type.enum';
import { Status } from 'src/modules/orders/entities/order-status.enum';

import { ChatService } from '../chat/chat.service';
import {
  GetUserChatsDto,
  MessageResponseDto,
  SendMessageDto,
  UserTypingDto,
} from '../chat/dto/index';
import { NotificationResponseDTO } from '../notifications/dto/notification-response.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

export type SocketWithAuth = {
  userId: string;
} & Socket;

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly Logger = new Logger(EventsGateway.name);
  private notificationsStore = new Map<string, NotificationResponseDTO[]>();

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  afterInit(server: Server): void {
    this.Logger.log('WebSocket server initialized');

    server.use(async (socket: SocketWithAuth, next) => {
      try {
        const token = socket.handshake.auth.token as string;

        if (!token) {
          next(new UnauthorizedException(Errors.NO_TOKEN_PROVIDED));
        }

        const { id: userId } = this.jwtService.decode(token);

        if (!userId) {
          next(new UnauthorizedException(Errors.INVALID_TOKEN));
        }

        const user = await this.userService.getUserById(userId);

        if (!user) {
          next(new BadRequestException(Errors.USER_NOT_FOUND));
        }

        socket.userId = userId;
        next();
      } catch (error) {
        next(new UnauthorizedException(Errors.TOKEN_VERIFICATION_FAILED));
      }
    });
  }

  async handleConnection(client: SocketWithAuth): Promise<void> {
    try {
      this.Logger.log(`Client connected: ${client.userId}`);

      const userChats = await this.chatService.getUserChats(client.userId);

      if (userChats) {
        client.join(client.userId);
        userChats.forEach((chat) => client.join(chat.id));
      }

      await this.userService.setUserOnline(client.userId);
      this.server.emit('userStatus', {
        userId: client.userId,
        status: 'online',
      });

      const notifications = this.notificationsStore.get(client.userId) || [];

      console.error('notifications: ' + notifications);
      console.error('notificationsStore: ' + this.notificationsStore);
      notifications.forEach((notification) => {
        client.emit('newNotification', notification);
      });

      this.notificationsStore.delete(client.userId);
    } catch (error) {
      this.Logger.error(`Error in handleConnection: ${error.message}`);
    }
  }

  async handleDisconnect(client: SocketWithAuth): Promise<void> {
    try {
      this.Logger.log(`Client disconnected: ${client.id}`);

      await this.userService.setUserOffline(client.userId);
      const lastActive = await this.userService.getLastActiveTime(
        client.userId,
      );

      this.server.emit('userStatus', {
        userId: client.userId,
        status: 'offline',
        lastActive,
      });
    } catch (error) {
      this.Logger.error(`Error in handleDisconnect: ${error.message}`);
    }
  }

  @SubscribeMessage('getUserChats')
  async handleGetUserChats(client: SocketWithAuth): Promise<GetUserChatsDto[]> {
    try {
      const userId = client.userId;
      const userChats = await this.chatService.getUserChats(userId);

      client.emit('userChats', userChats);

      return userChats;
    } catch (error) {
      this.Logger.error(`Error in handleGetUserChats: ${error.message}`);
      throw new BadRequestException(Errors.UNABLE_TO_RETRIEVE_USER_CHATS);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: SocketWithAuth,
    sendMessageDto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    try {
      const secondUser = await this.chatService.getChatSecondParticipant(
        client.userId,
        sendMessageDto.chatId,
      );
      const message = await this.chatService.sendMessage(
        client.userId,
        sendMessageDto,
      );

      this.server
        .to([sendMessageDto.chatId, secondUser.id])
        .emit('newMessage', message);

      return message;
    } catch (error) {
      this.Logger.error(`Error in handleSendMessage: ${error.message}`);
      throw new BadRequestException(Errors.UNABLE_TO_SEND_MESSAGE);
    }
  }

  @SubscribeMessage('userTyping')
  async handleUserTyping(
    client: SocketWithAuth,
    userTypingDto: UserTypingDto,
  ): Promise<void> {
    try {
      userTypingDto.userId = client.userId;
      client.broadcast
        .to(userTypingDto.chatId)
        .emit('userTyping', userTypingDto);
    } catch (error) {
      this.Logger.error(`Error in handleUserTyping: ${error.message}`);
    }
  }

  @SubscribeMessage('markMessageAsRead')
  async handleMarkMessageAsRead(
    client: SocketWithAuth,
    data: { chatId: string },
  ): Promise<void> {
    try {
      const { chatId } = data;

      await this.chatService.markMessageAsRead(client.userId, chatId);
    } catch (error) {
      this.Logger.error(`Error in handleMarkMessageAsRead: ${error.message}`);
    }
  }

  @SubscribeMessage('countUnreadMessages')
  async handleCountUnreadMessages(
    client: SocketWithAuth,
    data: { chatId: string },
  ): Promise<number> {
    try {
      const { chatId } = data;
      const count = await this.chatService.countUnreadMessages(
        client.userId,
        chatId,
      );

      client.emit('unreadMessageCount', { chatId, count });

      return count;
    } catch (error) {
      this.Logger.error(`Error in handleCountUnreadMessages: ${error.message}`);
      throw new BadRequestException(Errors.UNABLE_TO_COUNT_UNREAD_MESSAGES);
    }
  }

  @SubscribeMessage('createNotification')
  async handleCreateNotification(
    client: SocketWithAuth,
    notificationData: {
      type: Type;
      orderId?: number;
      userId?: string;
      shippingStatus?: Status;
    },
  ): Promise<void> {
    try {
      const savedNotification =
        await this.notificationsService.createNotification(
          notificationData.type,
          notificationData.userId,
          notificationData.orderId,
          notificationData.shippingStatus,
        );

      if (client.userId === notificationData.userId) {
        client.emit('newNotification', savedNotification);
      } else {
        await this.sendNotificationToUser(
          notificationData.userId,
          savedNotification,
        );
      }
    } catch (error) {
      throw new BadRequestException(Errors.UNABLE_TO_CREATE_NOTIFICATION);
    }
  }

  @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    client: SocketWithAuth,
    data: { userId: string },
  ): Promise<NotificationResponseDTO[]> {
    try {
      const notifications =
        await this.notificationsService.getNotificationsByUser(data.userId);

      client.emit('userNotifications', notifications);

      return notifications;
    } catch (error) {
      this.Logger.error(`Error in handleGetNotifications: ${error.message}`);
      throw new BadRequestException(Errors.UNABLE_TO_RETRIEVE_NOTIFICATIONS);
    }
  }

  async sendNotificationToUser(
    userId: string,
    notification: NotificationResponseDTO,
  ): Promise<void> {
    const connectedSockets = Array.from(this.server.sockets.sockets.values());
    const userSocket = connectedSockets.find(
      (socket) => (socket as SocketWithAuth).userId === userId,
    );

    if (userSocket) {
      (userSocket as SocketWithAuth).emit('newNotification', notification);
    } else {
      if (!this.notificationsStore.has(userId)) {
        this.notificationsStore.set(userId, []);
      }
      this.notificationsStore.get(userId).push(notification);
    }
  }
}
