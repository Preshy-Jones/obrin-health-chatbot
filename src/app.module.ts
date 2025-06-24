import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { OpenaiModule } from './openai/openai.module';
import { ConversationModule } from './conversation/conversation.module';
import { HealthModule } from './health/health.module';
import { ClinicModule } from './clinic/clinic.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    WhatsappModule,
    OpenaiModule,
    ConversationModule,
    HealthModule,
    ClinicModule,
    UserModule,
    ConfigModule.forRoot({
      // load: [configuration],
      isGlobal: true,
      cache: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
