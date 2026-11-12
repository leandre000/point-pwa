import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProfilesService } from './profiles.service.js';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  async getPublicProviders(
    @Query('search') search?: string,
    @Query('area') area?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.profilesService.getPublicProviders({
      search,
      area,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  async getPublicProvider(@Param('id') providerId: string) {
    return this.profilesService.getPublicProvider(providerId);
  }
}

