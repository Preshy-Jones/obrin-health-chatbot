import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class WhatsappService {
  private client: Twilio;
  private twilioNumber: string;
  private fromNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    // console.log('authToken', authToken);
    // console.log('accountSid', accountSid);
    // console.log('twilioNumber', this.twilioNumber);

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not found in environment');
    }

    this.client = new Twilio(accountSid, authToken);
  }

  async sendMessage(to: string, body: string): Promise<void> {
    // console.log(`Sending WhatsApp message to ${to}: ${body}`);
    // console.log(`From: ${this.twilioNumber}`);
    // console.log(`To: whatsapp:${to}`);

    try {
      await this.client.messages.create({
        from: `whatsapp:${this.twilioNumber}`,
        to: `whatsapp:${to}`,
        body,
      });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async sendMediaMessage(
    to: string,
    body: string,
    mediaUrl: string[],
  ): Promise<void> {
    try {
      await this.client.messages.create({
        from: `whatsapp:${this.twilioNumber}`,
        to: `whatsapp:${to}`,
        body,
        mediaUrl,
      });
    } catch (error) {
      console.error('Error sending WhatsApp media message:', error);
      throw error;
    }
  }
}
