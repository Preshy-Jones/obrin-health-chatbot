import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ConversationService } from 'src/conversation/conversation.service';
import { PrismaService } from 'prisma/prisma.service';
import { OpenaiService } from 'src/openai/openai.service';
import { UserService } from 'src/user/user.service';
import { HealthService } from 'src/health/health.service';
import { ClinicService } from 'src/clinic/clinic.service';
import { HealthModule } from 'src/health/health.module';
import { LocationService } from 'src/clinic/location.service';
import { ConversationStateService } from 'src/conversation/conversation-state.service';
import { ConversationalResponseService } from 'src/conversation/conversational-response.service';

@Module({
  imports: [forwardRef(() => HealthModule)],
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    ConversationService,
    PrismaService,
    OpenaiService,
    UserService,
    HealthService,
    ClinicService,
    LocationService,
    ConversationStateService,
    ConversationalResponseService,
  ],
  exports: [WhatsappService],
})
export class WhatsappModule {}
