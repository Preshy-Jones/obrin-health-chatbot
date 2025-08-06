import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class WhatsappService {
  private client: twilio.Twilio;
  private twilioNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !this.twilioNumber) {
      throw new Error('Missing Twilio configuration');
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendMessage(to: string, body: string): Promise<void> {
    console.log('📤 [WhatsAppService] Attempting to send message...');
    console.log(`- To: ${to}`);
    console.log(`- From: ${this.twilioNumber}`);
    console.log(`- Body length: ${body.length}`);

    // Split message if it exceeds WhatsApp's 1600 character limit
    const messages = this.splitMessage(body);

    for (let i = 0; i < messages.length; i++) {
      const messagePart = messages[i];
      console.log(
        `📤 [WhatsAppService] Sending part ${i + 1}/${messages.length}...`,
      );
      console.log(`- Part length: ${messagePart.length} characters`);

      try {
        console.log('🔄 [WhatsAppService] Calling Twilio API...');
        const message = await this.client.messages.create({
          from: `whatsapp:${this.twilioNumber}`,
          to: `whatsapp:${to}`,
          body: messagePart,
        });
        console.log(`✅ [WhatsAppService] Part ${i + 1} sent successfully!`);
        console.log(`- Message SID: ${message.sid}`);
        console.log(`- Status: ${message.status}`);

        // Add delay between messages to ensure proper delivery order
        if (i < messages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(
          `❌ [WhatsAppService] Error sending part ${i + 1}:`,
          error,
        );
        console.error('❌ [WhatsAppService] Error details:', {
          message: error.message,
          code: error.code,
          status: error.status,
          moreInfo: error.moreInfo,
        });
        throw error;
      }
    }

    console.log(
      `✅ [WhatsAppService] All ${messages.length} message parts sent successfully!`,
    );
  }

  private splitMessage(body: string): string[] {
    const MAX_LENGTH = 1600;

    // If message is within limit, return as single message
    if (body.length <= MAX_LENGTH) {
      return [body];
    }

    console.log(
      `📏 [WhatsAppService] Message exceeds ${MAX_LENGTH} characters, splitting into parts...`,
    );

    const messages: string[] = [];
    let remainingText = body;

    while (remainingText.length > 0) {
      let partLength = MAX_LENGTH;
      let messagePart = remainingText.substring(0, partLength);

      // Try to break at a natural point (newline, period, space)
      if (remainingText.length > MAX_LENGTH) {
        // Look for the last newline within the limit
        const lastNewline = messagePart.lastIndexOf('\n');
        if (lastNewline > MAX_LENGTH * 0.7) {
          // If newline is in the last 30% of the limit
          partLength = lastNewline + 1;
          messagePart = remainingText.substring(0, partLength);
        } else {
          // Look for the last period within the limit
          const lastPeriod = messagePart.lastIndexOf('.');
          if (lastPeriod > MAX_LENGTH * 0.8) {
            // If period is in the last 20% of the limit
            partLength = lastPeriod + 1;
            messagePart = remainingText.substring(0, partLength);
          } else {
            // Look for the last space within the limit
            const lastSpace = messagePart.lastIndexOf(' ');
            if (lastSpace > MAX_LENGTH * 0.8) {
              // If space is in the last 20% of the limit
              partLength = lastSpace + 1;
              messagePart = remainingText.substring(0, partLength);
            }
          }
        }
      }

      messages.push(messagePart);
      remainingText = remainingText.substring(partLength);
    }

    console.log(`📏 [WhatsAppService] Split into ${messages.length} parts`);
    return messages;
  }
}
