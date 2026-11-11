import { Controller, Get, Post, Body } from '@nestjs/common';
import { AreasService } from './areas.service.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CreateAreaSchema, type CreateAreaInput } from '@kiraka/contracts';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  async getAreas() {
    return this.areasService.getActiveAreas();
  }

  @Post()
  async createArea(@Body(new ZodValidationPipe(CreateAreaSchema)) body: CreateAreaInput) {
    return this.areasService.createArea(body);
  }
}

