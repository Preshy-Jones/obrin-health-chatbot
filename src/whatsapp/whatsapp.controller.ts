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

  // @Post('webhook')
  // async handleIncomingMessage(
  //   @Body() body: TwilioWebhookBody,
  //   @Res() res: Response,
  // ) {
  //   try {
  //     const phoneNumber = body.From.replace('whatsapp:', '');
  //     const message = body.Body;
  //     const hasMedia = parseInt(body.NumMedia) > 0;

  //     console.log('phoneNumber', phoneNumber);
  //     console.log('message', message);
  //     console.log('hasMedia', hasMedia);
  //     console.log('mediaUrl', body.MediaUrl0);
  //     console.log('mediaType', body.MediaContentType0);

  //     // Process the incoming message
  //     await this.conversationService.processIncomingMessage({
  //       phoneNumber,
  //       message,
  //       hasMedia,
  //       mediaUrl: body.MediaUrl0,
  //       mediaType: body.MediaContentType0,
  //     });

  //     res.status(HttpStatus.OK).send('OK');
  //   } catch (error) {
  //     console.error('Error processing WhatsApp webhook:', error);
  //     res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error');
  //   }
  // }

  @Post('webhook')
  async handleIncomingMessage(
    @Body() body: TwilioWebhookBody,
    @Res() res: Response,
  ) {
    try {
      const phoneNumber = body.From.replace('whatsapp:', '');
      const message = body.Body;
      const hasMedia = parseInt(body.NumMedia) > 0;

      console.log('phoneNumber', phoneNumber);
      console.log('message', message);
      console.log('hasMedia', hasMedia);
      console.log('mediaUrl', body.MediaUrl0);
      console.log('mediaType', body.MediaContentType0);

      // Process the incoming message
      await this.conversationService.processIncomingMessage({
        phoneNumber,
        message,
        hasMedia,
        mediaUrl: body.MediaUrl0,
        mediaType: body.MediaContentType0,
      });

      // ✅ FIXED: Return proper TwiML response
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;

      res.set('Content-Type', 'application/xml');
      res.status(HttpStatus.OK).send(twimlResponse);
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);

      // ✅ FIXED: Return proper TwiML response even on error
      const errorTwimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;

      res.set('Content-Type', 'application/xml');
      res.status(HttpStatus.OK).send(errorTwimlResponse);
    }
  }

  // Optional: Add status callback handler
  @Post('status')
  async handleStatusCallback(@Body() body: any, @Res() res: Response) {
    console.log(
      '📊 [WhatsApp] Status callback:',
      JSON.stringify(body, null, 2),
    );

    // Log message delivery status
    const messageSid = body.MessageSid;
    const messageStatus = body.MessageStatus;
    const errorCode = body.ErrorCode;
    const errorMessage = body.ErrorMessage;

    console.log(`📊 Message ${messageSid} status: ${messageStatus}`);
    if (errorCode) {
      console.error(`❌ Delivery Error ${errorCode}: ${errorMessage}`);
    }

    // Return proper TwiML response
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;

    res.set('Content-Type', 'application/xml');
    res.status(HttpStatus.OK).send(twimlResponse);
  }
}
