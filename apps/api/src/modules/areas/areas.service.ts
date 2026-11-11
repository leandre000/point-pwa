import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { CreateAreaInput } from '@kiraka/contracts';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all active Kigali service areas.
   */
  async getActiveAreas() {
    return this.prisma.serviceArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createArea(input: CreateAreaInput) {
    return this.prisma.serviceArea.create({
      data: input,
    });
  }
}

