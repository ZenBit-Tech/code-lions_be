import { Controller, Get, UseGuards, Param, Post, Body } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiTags,
  ApiCreatedResponse,
} from '@nestjs/swagger';

import { GetUserId } from 'src/common/decorators/get-user-id';

import { JwtAuthGuard } from '../auth/auth.guard';

import { ChatService } from './chat.service';
import {
  ChatRoomResponseDto,
  CreateChatDto,
  GetUserChatsDto,
} from './dto/index';
import { ChatRoom } from './entities/chat-room.entity';

@ApiTags('chats')
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all chat rooms for the authenticated user',
    tags: ['Chat Endpoints'],
    description:
      'This endpoint returns a list of chat rooms related to the authenticated user.',
  })
  @ApiOkResponse({
    description: 'The list of chat rooms for the authenticated user',
    type: [ChatRoomResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'No chat rooms found for the user',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: 'No chat rooms found for the user',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch chat rooms for the user',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to fetch chat rooms for the user',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async getUserChats(@GetUserId() userId: string): Promise<GetUserChatsDto[]> {
    return this.chatService.getUserChats(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific chat room by ID',
    tags: ['Chat Endpoints'],
    description:
      'This endpoint returns the details of a specific chat room including all messages.',
  })
  @ApiOkResponse({
    description: 'The details of the chat room including messages',
    type: ChatRoomResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Chat room not found or user not part of the chat room',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: 'Chat room not found or user not part of the chat room',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch chat room details',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to fetch chat room details',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the chat room',
  })
  async getChatById(
    @Param('id') chatId: string,
    @GetUserId() userId: string,
  ): Promise<ChatRoomResponseDto> {
    return this.chatService.getChatById(chatId, userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new chat room',
    tags: ['Chat Endpoints'],
    description:
      'This endpoint creates a new chat room with the specified details and returns the newly created chat room.',
  })
  @ApiCreatedResponse({
    description: 'The chat room has been successfully created',
    type: ChatRoom,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create chat room',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: { type: 'string', example: 'Failed to create chat room' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async createChat(
    @Body() chat: CreateChatDto,
    @GetUserId() userId: string,
  ): Promise<ChatRoom> {
    return this.chatService.createChat(userId, chat);
  }

  @Post('/support')
  @ApiOperation({
    summary: 'Create a new chat room with an admin',
    tags: ['Chat Endpoints'],
    description:
      'This endpoint creates a new chat room with an admin and returns the newly created chat room.',
  })
  @ApiCreatedResponse({
    description: 'The chat room has been successfully created',
    type: ChatRoom,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create chat room',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: { type: 'string', example: 'Failed to create chat room' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async createChatWithAdmin(@GetUserId() userId: string): Promise<ChatRoom> {
    return this.chatService.createChatWithAdmin(userId);
  }
}
