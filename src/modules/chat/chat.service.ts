import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/modules/users/user.entity';

import { EventsGateway } from '../events/events.gateway';

import {
  ChatRoomResponseDto,
  ChatUserDto,
  CreateChatDto,
  GetUserChatsDto,
  MessageResponseDto,
  SendMessageDto,
} from './dto/index';
import { ChatRoom } from './entities/chat-room.entity';
import { MessageRead } from './entities/message-read.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageRead)
    private readonly messageReadRepository: Repository<MessageRead>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  async getUserChats(userId: string): Promise<GetUserChatsDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['chatRooms', 'chatRooms.participants'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const chatRooms = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .leftJoinAndSelect('chatRoom.participants', 'participant')
      .leftJoinAndSelect('chatRoom.messages', 'message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('participant.id = :userId', { userId })
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    return await Promise.all(
      chatRooms.map((chatRoom) => this.toGetUserChatsDto(chatRoom, userId)),
    );
  }

  async getChatById(
    chatId: string,
    userId: string,
  ): Promise<ChatRoomResponseDto> {
    const chatRoom = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .leftJoinAndSelect('chatRoom.participants', 'participant')
      .leftJoinAndSelect('chatRoom.messages', 'message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('chatRoom.id = :chatId', { chatId })
      .orderBy('message.createdAt', 'DESC')
      .getOne();

    if (!chatRoom) {
      throw new NotFoundException(`Chat room with ID ${chatId} not found`);
    }

    if (
      !chatRoom.participants.some((participant) => participant.id === userId)
    ) {
      throw new NotFoundException(
        `User with ID ${userId} not part of chat room ${chatId}`,
      );
    }

    return this.toChatRoomResponseDto(chatRoom, userId);
  }

  async createChat(
    userId: string,
    createChatDto: CreateChatDto,
  ): Promise<ChatRoom> {
    const { chatPartnerId, content } = createChatDto;

    const firstUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!firstUser) {
      throw new NotFoundException('First user not found');
    }

    const secondUser = await this.userRepository.findOne({
      where: { id: chatPartnerId },
    });

    if (!secondUser) {
      throw new NotFoundException('Second user not found');
    }

    const existingChatRoomId = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .select('chatRoom.id')
      .leftJoin('chatRoom.participants', 'participant')
      .where('participant.id IN (:...userIds)', {
        userIds: [userId, chatPartnerId],
      })
      .groupBy('chatRoom.id')
      .having('COUNT(participant.id) = 2')
      .getRawOne();

    if (existingChatRoomId) {
      const existingChatRoom = await this.chatRoomRepository.findOne({
        where: { id: existingChatRoomId.chatRoom_id },
        relations: ['participants'],
      });

      return existingChatRoom;
    }

    const chatRoom = this.chatRoomRepository.create({
      participants: [firstUser, secondUser],
    });

    const savedChatRoom = await this.chatRoomRepository.save(chatRoom);

    this.eventsGateway.server.emit('newChat', savedChatRoom);

    if (content) {
      await this.sendMessage(userId, {
        chatId: savedChatRoom.id,
        content,
      });
    }

    return savedChatRoom;
  }

  async sendMessage(
    senderId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    const { chatId, content } = sendMessageDto;

    const chatRoom = await this.chatRoomRepository.findOne({
      where: { id: chatId },
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    const user = await this.userRepository.findOne({ where: { id: senderId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const message = this.messageRepository.create({
      content,
      chatRoom,
      sender: user,
    });

    return this.messageRepository.save(message);
  }

  async markMessageAsRead(userId: string, chatId: string): Promise<void> {
    const chatRoom = await this.chatRoomRepository.findOne({
      where: { id: chatId },
      relations: [
        'messages',
        'messages.reads',
        'messages.sender',
        'messages.reads.user',
      ],
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    const messagesToMarkRead = chatRoom.messages.filter((message) => {
      if (!message.sender) {
        throw new BadRequestException(`Message ${message.id} has no sender`);
      }

      return (
        message.sender.id !== userId &&
        !message.reads.some((read) => read.user.id === userId)
      );
    });

    const messageReads = messagesToMarkRead.map((message) => {
      const messageRead = new MessageRead();

      messageRead.message = message;
      messageRead.user = { id: userId } as User;

      return messageRead;
    });

    await this.messageReadRepository.save(messageReads);
  }

  async countUnreadMessages(userId: string, chatId: string): Promise<number> {
    const count = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoin('message.reads', 'reads')
      .where('message.chatRoomId = :chatRoomId', { chatRoomId: chatId })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('(reads.userId IS NULL OR reads.userId != :userId)', { userId })
      .getCount();

    return count;
  }

  async getLastMessage(chatId: string): Promise<Message | null> {
    const lastMessage = await this.messageRepository.findOne({
      where: { chatRoom: { id: chatId } },
      order: { createdAt: 'DESC' },
      relations: ['sender'],
    });

    return lastMessage || null;
  }

  private toChatRoomResponseDto(
    chatRoom: ChatRoom,
    userId: string,
  ): ChatRoomResponseDto {
    const chatPartner = chatRoom.participants.find(
      (participant) => participant.id !== userId,
    );

    const chatPartnerDto = chatPartner
      ? new ChatUserDto({
          id: chatPartner.id,
          name: chatPartner.name,
          photoUrl: chatPartner.photoUrl,
        })
      : null;

    const messages = chatRoom.messages.map((message) => {
      return new MessageResponseDto({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          photoUrl: message.sender.photoUrl,
        },
      });
    });

    return new ChatRoomResponseDto({
      id: chatRoom.id,
      chatPartner: chatPartnerDto,
      messages: messages,
    });
  }

  private async toGetUserChatsDto(
    chatRoom: ChatRoom,
    userId: string,
  ): Promise<GetUserChatsDto> {
    const chatPartner = chatRoom.participants.find(
      (participant) => participant.id !== userId,
    );

    const chatPartnerDto = chatPartner
      ? new ChatUserDto({
          id: chatPartner.id,
          name: chatPartner.name,
          photoUrl: chatPartner.photoUrl,
        })
      : null;

    const unreadMessageCount = await this.countUnreadMessages(
      userId,
      chatRoom.id,
    );
    const lastMessage = await this.getLastMessage(chatRoom.id);

    const lastMessageDto = lastMessage
      ? new MessageResponseDto({
          id: lastMessage.id,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          sender: {
            id: lastMessage.sender.id,
            name: lastMessage.sender.name,
            photoUrl: lastMessage.sender.photoUrl,
          },
        })
      : null;

    return new GetUserChatsDto({
      id: chatRoom.id,
      chatPartner: chatPartnerDto,
      unreadMessageCount,
      lastMessage: lastMessageDto,
    });
  }
}
