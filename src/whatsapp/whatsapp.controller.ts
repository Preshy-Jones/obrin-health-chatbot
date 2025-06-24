import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ConversationService } from 'src/conversation/conversation.service';
import { Response } from 'express';

interface TwilioWebhookBody {
  From: string;
  Body: string;
  MessageSid: string;
  AccountSid: string;
  To: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  NumMedia: string;
}

@Controller('whatsapp')
export class WhatsappController {
  constructor(private conversationService: ConversationService) {}

  @Post('webhook')
  async handleIncomingMessage(
    @Body() body: TwilioWebhookBody,
    @Res() res: Response,
  ) {
    try {
      const phoneNumber = body.From.replace('whatsapp:', '');
      const message = body.Body;
      const hasMedia = parseInt(body.NumMedia) > 0;

      // Process the incoming message
      await this.conversationService.processIncomingMessage({
        phoneNumber,
        message,
        hasMedia,
        mediaUrl: body.MediaUrl0,
        mediaType: body.MediaContentType0,
      });

      res.status(HttpStatus.OK).send('OK');
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error');
    }
  }
}
