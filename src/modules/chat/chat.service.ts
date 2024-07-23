import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserResponseDto } from 'src/modules/auth/dto/user-response.dto';
import { User } from 'src/modules/users/user.entity';

import { ChatRoomResponseDto } from './dto/chat-room-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
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
    const chatRooms = await this.chatRoomRepository.find({
      relations: ['participants', 'messages'],
    });

    const userChats = chatRooms.filter((chatRoom) =>
      chatRoom.participants.some((participant) => participant.id === userId),
    );

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

  private toChatRoomResponseDto(
    chatRoom: ChatRoom,
    userId: string,
  ): ChatRoomResponseDto {
    const chatPartner = chatRoom.participants.find(
      (participant) => participant.id !== userId,
    );

    const chatPartnerDto = new UserResponseDto();

    chatPartnerDto.id = chatPartner.id;
    chatPartnerDto.name = chatPartner.name;
    chatPartnerDto.photoUrl = chatPartner.photoUrl;

    const messages = chatRoom.messages.map((message) => {
      const messageDto = new MessageResponseDto();

      messageDto.id = message.id;
      messageDto.content = message.content;
      messageDto.createdAt = message.createdAt;
      messageDto.sender = {
        id: message.sender.id,
        name: message.sender.name,
        photoUrl: message.sender.photoUrl,
      };

      return messageDto;
    });

    const chatRoomResponseDto = new ChatRoomResponseDto();

    chatRoomResponseDto.id = chatRoom.id;
    chatRoomResponseDto.chatPartner = chatPartnerDto;
    chatRoomResponseDto.messages = messages;

    return chatRoomResponseDto;
  }
}
