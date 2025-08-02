import { Module, forwardRef } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { MenstrualTrackingService } from './menstrual-tracking.service';
import { SymptomCheckerService } from './symptom-checker.service';
import { PrismaService } from 'prisma/prisma.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [forwardRef(() => WhatsappModule)],
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
