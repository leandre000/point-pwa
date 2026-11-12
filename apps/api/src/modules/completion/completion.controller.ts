import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompletionService } from './completion.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  ReportCompletionSchema,
  ReportCompletionInput,
  ConfirmCompletionSchema,
  ConfirmCompletionInput,
  CreateDisputeSchema,
  CreateDisputeInput,
  CreateReviewSchema,
  CreateReviewInput,
} from '@kiraka/contracts';

@Controller('matches')
@UseGuards(AuthGuard)
export class CompletionController {
  constructor(private readonly completionService: CompletionService) {}

  @Get(':id')
  async getMatchDetails(
    @Param('id') matchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.completionService.getMatchDetails(matchId, userId);
  }

  @Post(':id/completion')
  @HttpCode(HttpStatus.OK)
  async reportCompletion(
    @Param('id') matchId: string,
    @CurrentUser('id') providerId: string,
    @Body(new ZodValidationPipe(ReportCompletionSchema))
    input: ReportCompletionInput,
  ) {
    return this.completionService.reportCompletion(matchId, providerId, input);
  }

  @Post(':id/confirm-completion')
  @HttpCode(HttpStatus.OK)
  async confirmCompletion(
    @Param('id') matchId: string,
    @CurrentUser('id') customerId: string,
    @Body(new ZodValidationPipe(ConfirmCompletionSchema.optional()))
    input?: ConfirmCompletionInput,
  ) {
    return this.completionService.confirmCompletion(matchId, customerId, input);
  }

  @Post(':id/disputes')
  @HttpCode(HttpStatus.CREATED)
  async raiseDispute(
    @Param('id') matchId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateDisputeSchema))
    input: CreateDisputeInput,
  ) {
    return this.completionService.raiseDispute(matchId, userId, input);
  }

  @Post(':id/reviews')
  @HttpCode(HttpStatus.CREATED)
  async leaveReview(
    @Param('id') matchId: string,
    @CurrentUser('id') authorId: string,
    @Body(new ZodValidationPipe(CreateReviewSchema))
    input: CreateReviewInput,
  ) {
    return this.completionService.leaveReview(matchId, authorId, input);
  }
}

