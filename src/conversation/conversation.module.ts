import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationStateService } from './conversation-state.service';
import { ConversationalResponseService } from './conversational-response.service';
import { PrismaService } from 'prisma/prisma.service';
import { OpenaiService } from 'src/openai/openai.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { UserService } from 'src/user/user.service';
import { HealthService } from 'src/health/health.service';
import { ClinicService } from 'src/clinic/clinic.service';
import { MenstrualTrackingService } from 'src/health/menstrual-tracking.service';
import { SymptomCheckerService } from 'src/health/symptom-checker.service';
import { LocationService } from 'src/clinic/location.service';

@Module({
  providers: [
    ConversationService,
    ConversationStateService,
    ConversationalResponseService,
    PrismaService,
    OpenaiService,
    WhatsappService,
    UserService,
    HealthService,
    ClinicService,
    MenstrualTrackingService,
    SymptomCheckerService,
    LocationService,
  ],
  exports: [
    ConversationService,
    ConversationStateService,
    ConversationalResponseService,
  ],
})
export class ConversationModule {}
