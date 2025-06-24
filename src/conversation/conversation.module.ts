import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { PrismaService } from 'prisma/prisma.service';
import { OpenaiService } from 'src/openai/openai.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { UserService } from 'src/user/user.service';
import { HealthService } from 'src/health/health.service';
import { ClinicService } from 'src/clinic/clinic.service';

@Module({
  controllers: [ConversationController],
  providers: [
    ConversationService,
    PrismaService,
    OpenaiService,
    WhatsappService,
    UserService,
    HealthService,
    ClinicService,
  ],
})
export class ConversationModule {}
