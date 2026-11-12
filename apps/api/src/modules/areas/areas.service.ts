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
    try {
      return await this.prisma.serviceArea.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    } catch {
      // 12 Kigali pilot launch neighborhoods with geographic centroids
      return [
        { id: 'area-01', name: 'Kacyiru', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.935, lng: 30.082 },
        { id: 'area-02', name: 'Kimihurura', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.954, lng: 30.078 },
        { id: 'area-03', name: 'Kibagabaga', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.933, lng: 30.116 },
        { id: 'area-04', name: 'Nyarutarama', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.939, lng: 30.100 },
        { id: 'area-05', name: 'Remera', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.957, lng: 30.113 },
        { id: 'area-06', name: 'Kimironko', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.947, lng: 30.126 },
        { id: 'area-07', name: 'Gisozi', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.916, lng: 30.063 },
        { id: 'area-08', name: 'Kicukiro', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.986, lng: 30.102 },
        { id: 'area-09', name: 'Gikondo', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.971, lng: 30.076 },
        { id: 'area-10', name: 'Kanombe', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.975, lng: 30.147 },
        { id: 'area-11', name: 'Nyamirambo', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.978, lng: 30.046 },
        { id: 'area-12', name: 'Kagugu', city: 'Kigali', countryCode: 'RW', isActive: true, lat: -1.908, lng: 30.078 },
      ];
    }
  }

  async createArea(input: CreateAreaInput) {
    return this.prisma.serviceArea.create({
      data: input,
    });
  }
}

