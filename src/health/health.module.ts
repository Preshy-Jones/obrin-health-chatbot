import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { MenstrualTrackingService } from './menstrual-tracking.service';
import { SymptomCheckerService } from './symptom-checker.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    MenstrualTrackingService,
    SymptomCheckerService,
    PrismaService,
  ],
  exports: [HealthService, MenstrualTrackingService, SymptomCheckerService],
})
export class HealthModule {}
