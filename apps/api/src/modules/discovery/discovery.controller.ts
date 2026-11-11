import { Controller, Get, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  ProviderSearchQuerySchema,
  type ProviderSearchQuery,
} from '@kiraka/contracts';

@Controller('providers')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  async searchProviders(
    @Query(new ZodValidationPipe(ProviderSearchQuerySchema)) query: ProviderSearchQuery,
  ) {
    return this.discoveryService.searchProviders(query);
  }
}

