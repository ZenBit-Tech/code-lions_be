import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { IS_VALID_URL } from 'src/config';
import { Role } from 'src/modules/roles/role.enum';
import { User } from 'src/modules/users/user.entity';

import { EventsGateway } from '../events/events.gateway';

import { chatContentType } from './chat-content.enum';
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
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['chatRooms', 'chatRooms.participants'],
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_DOES_NOT_EXIST);
      }

      const chatRooms = await this.chatRoomRepository
        .createQueryBuilder('chatRoom')
        .leftJoinAndSelect('chatRoom.participants', 'participant')
        .leftJoinAndSelect('chatRoom.participants', 'secondParticipant')
        .leftJoinAndSelect('chatRoom.messages', 'message')
        .leftJoinAndSelect('message.sender', 'sender')
        .where('participant.id = :userId', { userId })
        .andWhere('secondParticipant.id != :userId', { userId })
        .orderBy('message.createdAt', 'DESC')
        .getMany();

      return await Promise.all(
        chatRooms.map((chatRoom) => this.toGetUserChatsDto(chatRoom, userId)),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(Errors.UNABLE_TO_RETRIEVE_USER_CHATS);
    }
  }

  async getChatById(
    chatId: string,
    userId: string,
  ): Promise<ChatRoomResponseDto> {
    try {
      const chatRoom = await this.chatRoomRepository
        .createQueryBuilder('chatRoom')
        .leftJoinAndSelect('chatRoom.participants', 'participant')
        .leftJoinAndSelect('chatRoom.messages', 'message')
        .leftJoinAndSelect('message.sender', 'sender')
        .where('chatRoom.id = :chatId', { chatId })
        .orderBy('message.createdAt', 'ASC')
        .getOne();

      if (!chatRoom) {
        throw new NotFoundException(Errors.CHAT_ROOM_NOT_FOUND);
      }

      if (
        !chatRoom.participants.some((participant) => participant.id === userId)
      ) {
        throw new NotFoundException(Errors.USER_IS_NOT_IN_THIS_CHAT_ROOM);
      }

      return this.toChatRoomResponseDto(chatRoom, userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(Errors.UNABLE_TO_RETRIEVE_CHAT);
    }
  }

  async createChat(
    userId: string,
    createChatDto: CreateChatDto,
  ): Promise<ChatRoom> {
    try {
      const { chatPartnerId, content } = createChatDto;

      const firstUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!firstUser) {
        throw new NotFoundException(Errors.FIRST_USER_NOT_FOUND);
      }

      const secondUser = await this.userRepository.findOne({
        where: { id: chatPartnerId },
      });

      if (!secondUser) {
        throw new NotFoundException(Errors.SECOND_USER_NOT_FOUND);
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

      this.eventsGateway.server
        .to([firstUser.id, secondUser.id])
        .emit('newChat', savedChatRoom);

      if (content) {
        await this.sendMessage(userId, {
          chatId: savedChatRoom.id,
          content,
        });
      }

      return savedChatRoom;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(Errors.UNABLE_TO_CREATE_CHAT);
    }
  }

  async createChatWithAdmin(userId: string): Promise<ChatRoom> {
    try {
      const adminUser = await this.userRepository.findOne({
        where: { role: Role.ADMIN },
      });

      if (!adminUser) {
        throw new NotFoundException(Errors.ADMIN_NOT_FOUND);
      }

      const firstUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!firstUser) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const existingChatRoomId = await this.chatRoomRepository
        .createQueryBuilder('chatRoom')
        .select('chatRoom.id')
        .leftJoin('chatRoom.participants', 'participant')
        .where('participant.id IN (:...userIds)', {
          userIds: [userId, adminUser.id],
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
        participants: [firstUser, adminUser],
      });

      const savedChatRoom = await this.chatRoomRepository.save(chatRoom);

      this.eventsGateway.server
        .to([firstUser.id, adminUser.id])
        .emit('newChat', savedChatRoom);

      return savedChatRoom;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(Errors.UNABLE_TO_CREATE_CHAT_WITH_ADMIN);
    }
  }

  async sendMessage(
    senderId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    try {
      const { chatId, content, fileUrl, fileType } = sendMessageDto;

      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: chatId },
      });

      if (!chatRoom) {
        throw new NotFoundException(Errors.CHAT_ROOM_NOT_FOUND);
      }

      const user = await this.userRepository.findOne({
        where: { id: senderId },
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      let determinedFileType = fileType;

      if (!fileType) {
        if (content && content.match(IS_VALID_URL)) {
          determinedFileType = chatContentType.LINK;
        } else if (fileUrl) {
          if (fileUrl.startsWith('image/')) {
            determinedFileType = chatContentType.IMAGE;
          } else {
            determinedFileType = chatContentType.FILE;
          }
        } else {
          determinedFileType = chatContentType.TEXT;
        }
      }

      const message = this.messageRepository.create({
        content,
        fileUrl,
        fileType: determinedFileType,
        chatRoom,
        sender: user,
      });

      const savedMessage = await this.messageRepository.save(message);

      this.toMessageResponseDto(savedMessage);

      return this.toMessageResponseDto(savedMessage);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(Errors.UNABLE_TO_SEND_MESSAGE);
    }
  }

  async uploadFile(
    senderId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<void> {
    try {
      const secondUser = await this.getChatSecondParticipant(
        senderId,
        sendMessageDto.chatId,
      );
      const message = await this.sendMessage(senderId, sendMessageDto);

      this.eventsGateway.server
        .to([sendMessageDto.chatId, secondUser.id])
        .emit('newMessage', message);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(Errors.UNABLE_TO_UPLOAD_FILE);
    }
  }

  async markMessageAsRead(userId: string, chatId: string): Promise<void> {
    try {
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
        throw new NotFoundException(Errors.CHAT_ROOM_NOT_FOUND);
      }

      const messagesToMarkRead = chatRoom.messages.filter((message) => {
        if (!message.sender) {
          throw new BadRequestException(Errors.MESSAGE_HAS_NO_SENDER);
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
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(Errors.UNABLE_TO_MARK_MESSAGE_AS_READ);
    }
  }

  async countUnreadMessages(userId: string, chatId: string): Promise<number> {
    try {
      const count = await this.messageRepository
        .createQueryBuilder('message')
        .leftJoin('message.reads', 'reads')
        .where('message.chatRoomId = :chatRoomId', { chatRoomId: chatId })
        .andWhere('message.senderId != :userId', { userId })
        .andWhere('(reads.userId IS NULL OR reads.userId != :userId)', {
          userId,
        })
        .getCount();

      return count;
    } catch (error) {
      throw new BadRequestException(Errors.UNABLE_TO_COUNT_UNREAD_MESSAGES);
    }
  }

  async getLastMessage(chatId: string): Promise<Message | null> {
    try {
      const lastMessage = await this.messageRepository.findOne({
        where: { chatRoom: { id: chatId } },
        order: { createdAt: 'DESC' },
        relations: ['sender'],
      });

      return lastMessage || null;
    } catch (error) {
      throw new BadRequestException(Errors.UNABLE_TO_RETRIEVE_LAST_MESSAGE);
    }
  }

  async getChatSecondParticipant(
    firstUserId: string,
    chatId: string,
  ): Promise<User> {
    try {
      const firstIndexOfArray = 0;
      const chatRoom = await this.chatRoomRepository
        .createQueryBuilder('chatRoom')
        .select(['chatRoom.id', 'participant.id'])
        .leftJoin('chatRoom.participants', 'participant')
        .where('participant.id <> :participantId', {
          participantId: firstUserId,
        })
        .andWhere('chatRoom.id = :chatId', { chatId })
        .getOne();

      if (!chatRoom) {
        throw new NotFoundException(Errors.CHAT_ROOM_NOT_FOUND);
      }

      if (!chatRoom.participants.length) {
        throw new NotFoundException(Errors.SECOND_USER_NOT_FOUND);
      }

      return chatRoom.participants[firstIndexOfArray];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(Errors.SECOND_USER_NOT_FOUND);
    }
  }

  private toMessageResponseDto(message: Message): MessageResponseDto | null {
    if (message) {
      let contentType: string;

      if (message.content) {
        contentType = chatContentType.TEXT;
      } else if (message.fileType === chatContentType.IMAGE) {
        contentType = chatContentType.IMAGE;
      } else {
        contentType = chatContentType.FILE;
      }

      return new MessageResponseDto({
        id: message.id,
        content: message.content || message.fileUrl,
        contentType,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          photoUrl: message.sender.photoUrl,
        },
      });
    }

    return null;
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
      return this.toMessageResponseDto(message);
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
          isOnline: chatPartner.isOnline,
          lastActiveAt: chatPartner.lastActiveAt,
        })
      : null;

    const unreadMessageCount = await this.countUnreadMessages(
      userId,
      chatRoom.id,
    );
    const lastMessage = await this.getLastMessage(chatRoom.id);

    const lastMessageDto = this.toMessageResponseDto(lastMessage);

    return new GetUserChatsDto({
      id: chatRoom.id,
      chatPartner: chatPartnerDto,
      unreadMessageCount,
      lastMessage: lastMessageDto,
    });
  }
}
