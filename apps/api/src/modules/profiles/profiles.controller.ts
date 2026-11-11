import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  OnboardingSchema,
  UpdateCustomerProfileSchema,
  UpdateProviderProfileSchema,
  type OnboardingInput,
  type UpdateCustomerProfileInput,
  type UpdateProviderProfileInput,
} from '@kiraka/contracts';
import type { User } from '@prisma/client';

@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: User) {
    return this.profilesService.getMe(user.id);
  }

  @Post('me/onboarding')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(OnboardingSchema)) body: OnboardingInput,
  ) {
    return this.profilesService.completeOnboarding(user.id, body);
  }

  @Put('me/customer-profile')
  @UseGuards(AuthGuard)
  async updateCustomerProfile(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(UpdateCustomerProfileSchema)) body: UpdateCustomerProfileInput,
  ) {
    return this.profilesService.updateCustomerProfile(user.id, body);
  }

  @Put('me/provider-profile')
  @UseGuards(AuthGuard)
  async updateProviderProfile(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(UpdateProviderProfileSchema)) body: UpdateProviderProfileInput,
  ) {
    return this.profilesService.updateProviderProfile(user.id, body);
  }

  @Get('providers/:id')
  async getPublicProvider(@Param('id') providerId: string) {
    return this.profilesService.getPublicProvider(providerId);
  }
}
