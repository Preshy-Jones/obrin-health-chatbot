import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ConversationService } from 'src/conversation/conversation.service';
import { PrismaService } from 'prisma/prisma.service';
import { OpenaiService } from 'src/openai/openai.service';
import { UserService } from 'src/user/user.service';
import { HealthService } from 'src/health/health.service';
import { ClinicService } from 'src/clinic/clinic.service';
import { MenstrualTrackingService } from 'src/health/menstrual-tracking.service';
import { SymptomCheckerService } from 'src/health/symptom-checker.service';

@Module({
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    ConversationService,
    PrismaService,
    OpenaiService,
    UserService,
    HealthService,
    ClinicService,
    MenstrualTrackingService,
    SymptomCheckerService,
  ],
})
export class WhatsappModule {}
