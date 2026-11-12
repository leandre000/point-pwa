import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  SendMessageSchema,
  ShareAddressSchema,
  type SendMessageInput,
  type ShareAddressInput,
} from '@kiraka/contracts';
import type { User } from '@prisma/client';

@Controller('conversations')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async listConversations(@CurrentUser() user: User) {
    return this.messagesService.listUserConversations(user.id);
  }

  @Get(':matchId')
  async getConversation(
    @Param('matchId') matchId: string,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.getConversationMessages(matchId, user.id);
  }

  @Post(':matchId/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('matchId') matchId: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(SendMessageSchema)) body: SendMessageInput,
  ) {
    return this.messagesService.sendMessage(matchId, user.id, body);
  }

  @Post(':matchId/share-address')
  @HttpCode(HttpStatus.OK)
  async shareAddress(
    @Param('matchId') matchId: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(ShareAddressSchema)) body: ShareAddressInput,
  ) {
    return this.messagesService.shareAddress(matchId, user.id, body);
  }
}

