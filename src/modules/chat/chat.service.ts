import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/modules/users/user.entity';

import { ChatRoomResponseDto } from './dto/chat-room-response.dto';
import { ChatUserDto } from './dto/chat-user.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserChats(userId: string): Promise<ChatRoomResponseDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'chatRooms',
        'chatRooms.participants',
        'chatRooms.messages',
        'chatRooms.messages.sender',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userChats = user.chatRooms;

    return userChats.map((chatRoom) =>
      this.toChatRoomResponseDto(chatRoom, userId),
    );
  }

  async getChatById(
    chatId: string,
    userId: string,
  ): Promise<ChatRoomResponseDto> {
    const chatRoom = await this.chatRoomRepository.findOne({
      where: { id: chatId },
      relations: ['participants', 'messages', 'messages.sender'],
    });

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
    const { chatPartnerId } = createChatDto;

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
      return this.chatRoomRepository.findOne({
        where: { id: existingChatRoomId.chatRoom_id },
        relations: ['participants'],
      });
    }

    const chatRoom = this.chatRoomRepository.create({
      participants: [firstUser, secondUser],
    });

    return this.chatRoomRepository.save(chatRoom);
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
}
