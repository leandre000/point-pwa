import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  CreateJobSchema,
  JobFeedQuerySchema,
  type CreateJobInput,
  type JobFeedQuery,
} from '@kiraka/contracts';
import type { User } from '@prisma/client';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createJob(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateJobSchema)) body: CreateJobInput,
  ) {
    return this.jobsService.createJob(user.id, body);
  }

  @Get()
  async getJobsFeed(@Query(new ZodValidationPipe(JobFeedQuerySchema)) query: JobFeedQuery) {
    return this.jobsService.getJobsFeed(query);
  }

  @Get('my')
  @UseGuards(AuthGuard)
  async getMyJobs(@CurrentUser() user: User) {
    return this.jobsService.getCustomerJobs(user.id);
  }

  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return this.jobsService.getJobById(id);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelJob(@Param('id') id: string, @CurrentUser() user: User) {
    return this.jobsService.cancelJob(id, user.id);
  }
}
