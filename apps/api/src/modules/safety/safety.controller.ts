import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SafetyService } from './safety.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  CreateReportSchema,
  CreateReportInput,
  BlockUserSchema,
  BlockUserInput,
} from '@kiraka/contracts';

@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Get('emergency-contacts')
  getEmergencyContacts() {
    return this.safetyService.getEmergencyContacts();
  }

  @Post('reports')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReport(
    @CurrentUser('id') reporterId: string,
    @Body(new ZodValidationPipe(CreateReportSchema)) input: CreateReportInput,
  ) {
    return this.safetyService.createReport(reporterId, input);
  }

  @Post('blocks')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async blockUser(
    @CurrentUser('id') blockerId: string,
    @Body(new ZodValidationPipe(BlockUserSchema)) input: BlockUserInput,
  ) {
    return this.safetyService.blockUser(blockerId, input);
  }

  @Delete('blocks/:targetUserId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async unblockUser(
    @CurrentUser('id') blockerId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.safetyService.unblockUser(blockerId, targetUserId);
  }
}

