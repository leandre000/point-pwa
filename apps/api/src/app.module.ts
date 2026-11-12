import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { AreasModule } from './modules/areas/areas.module.js';
import { DiscoveryModule } from './modules/discovery/discovery.module.js';
import { JobsModule } from './modules/jobs/jobs.module.js';
import { OffersModule } from './modules/offers/offers.module.js';
import { MessagesModule } from './modules/messages/messages.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { CompletionModule } from './modules/completion/completion.module.js';
import { SafetyModule } from './modules/safety/safety.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { EmailModule } from './modules/email/email.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { PrismaModule } from './database/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '../../.env.local'),
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), '.env'),
        '.env.local',
        '.env',
      ],
    }),
    PrismaModule,
    EmailModule,
    UploadsModule,
    HealthModule,
    AuthModule,
    ProfilesModule,
    CategoriesModule,
    AreasModule,
    DiscoveryModule,
    JobsModule,
    OffersModule,
    MessagesModule,
    NotificationsModule,
    CompletionModule,
    SafetyModule,
    AdminModule,
  ],
})
export class AppModule {}
