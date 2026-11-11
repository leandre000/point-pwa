import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { AreasModule } from './modules/areas/areas.module.js';
import { DiscoveryModule } from './modules/discovery/discovery.module.js';
import { PrismaService } from './database/prisma.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HealthModule,
    AuthModule,
    ProfilesModule,
    CategoriesModule,
    AreasModule,
    DiscoveryModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
