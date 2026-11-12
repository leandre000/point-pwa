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
import { OffersService } from './offers.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  CreateOfferSchema,
  CounterOfferSchema,
  type CreateOfferInput,
  type CounterOfferInput,
} from '@kiraka/contracts';
import type { User } from '@prisma/client';

@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post('jobs/:jobId/offers')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async submitOffer(
    @Param('jobId') jobId: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateOfferSchema.omit({ jobId: true })))
    body: Omit<CreateOfferInput, 'jobId'>,
  ) {
    return this.offersService.submitOffer(user.id, {
      ...body,
      jobId,
    });
  }

  @Get('jobs/:jobId/offers')
  @UseGuards(AuthGuard)
  async getJobOffers(@Param('jobId') jobId: string, @CurrentUser() user: User) {
    return this.offersService.getJobOffers(jobId, user.id);
  }

  @Post('offers/:id/counter')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async counterOffer(
    @Param('id') offerId: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CounterOfferSchema)) body: CounterOfferInput,
  ) {
    return this.offersService.counterOffer(offerId, user.id, body);
  }

  @Post('offers/:id/withdraw')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async withdrawOffer(@Param('id') offerId: string, @CurrentUser() user: User) {
    return this.offersService.withdrawOffer(offerId, user.id);
  }

  @Post('offers/:id/accept')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async acceptOffer(@Param('id') offerId: string, @CurrentUser() user: User) {
    return this.offersService.acceptOffer(offerId, user.id);
  }

  @Get('matches/:id')
  @UseGuards(AuthGuard)
  async getMatch(@Param('id') matchId: string, @CurrentUser() user: User) {
    return this.offersService.getMatchById(matchId, user.id);
  }
}

