import { Injectable } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { HealthService } from '../health/health.service';
import { PrismaService } from 'prisma/prisma.service';
import { OpenaiService } from 'src/openai/openai.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { ClinicService } from 'src/clinic/clinic.service';
import { ChatCompletionMessageParam } from 'openai/resources';

interface IncomingMessage {
  phoneNumber: string;
  message: string;
  hasMedia: boolean;
  mediaUrl?: string;
  mediaType?: string;
}

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private openAi: OpenaiService,
    private whatsapp: WhatsappService,
    private userService: UserService,
    private healthService: HealthService,
    private clinicService: ClinicService,
  ) {}

  async processIncomingMessage(messageData: IncomingMessage): Promise<void> {
    const { phoneNumber, message } = messageData;

    try {
      // Get or create user
      const user = await this.userService.findOrCreateUser(phoneNumber);

      // If user sends location in message (e.g., 'My location is 6.5244, 3.3792' or 'lat:..., lng:...'), parse and store it
      const locationMatch = message.match(
        /([+-]?\d+\.\d+)[,\s]+([+-]?\d+\.\d+)/,
      );
      if (locationMatch) {
        const lat = parseFloat(locationMatch[1]);
        const lng = parseFloat(locationMatch[2]);
        await this.userService.updateUserLocation(user.id, lat, lng);
        await this.whatsapp.sendMessage(
          phoneNumber,
          'Thanks! I have saved your location. Now I can find clinics near you.',
        );
      }

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(user.id);

      // Save user message
      await this.saveMessage(conversation.id, message, 'USER');

      // Detect intent and generate response
      const intent = await this.detectIntent(message, user);
      const response = await this.generateContextualResponse(
        message,
        intent,
        user,
        conversation.id,
      );

      // Save assistant response
      await this.saveMessage(conversation.id, response, 'ASSISTANT');

      // Send response via WhatsApp
      await this.whatsapp.sendMessage(phoneNumber, response);
    } catch (error) {
      console.error('Error processing message:', error);
      await this.whatsapp.sendMessage(
        phoneNumber,
        "I'm sorry, I'm having some technical difficulties. Please try again in a moment. 🤖",
      );
    }
  }

  private async detectIntent(message: string, user: any): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Clinic/location related
    if (
      lowerMessage.includes('clinic') ||
      lowerMessage.includes('hospital') ||
      lowerMessage.includes('doctor')
    ) {
      return 'clinic_search';
    }

    // Symptom checking
    if (
      lowerMessage.includes('symptom') ||
      lowerMessage.includes('pain') ||
      lowerMessage.includes('discharge')
    ) {
      return 'symptom_check';
    }

    // Period/menstrual health
    if (
      lowerMessage.includes('period') ||
      lowerMessage.includes('menstrual') ||
      lowerMessage.includes('cramp')
    ) {
      return 'menstrual_health';
    }

    // Contraception
    if (
      lowerMessage.includes('contraception') ||
      lowerMessage.includes('birth control') ||
      lowerMessage.includes('pill')
    ) {
      return 'contraception';
    }

    // STI related
    if (
      lowerMessage.includes('sti') ||
      lowerMessage.includes('std') ||
      lowerMessage.includes('infection')
    ) {
      return 'sti_information';
    }

    // General greeting
    if (
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('hey')
    ) {
      return 'greeting';
    }

    return 'general_health';
  }

  private async generateContextualResponse(
    message: string,
    intent: string,
    user: any,
    conversationId: string,
  ): Promise<string> {
    switch (intent) {
      case 'greeting':
        return `Hello! 👋 I'm your Obrin Health assistant. I'm here to help with questions about sexual and reproductive health. How can I support you today?`;

      case 'clinic_search':
        return await this.handleClinicSearch(message, user);

      case 'symptom_check':
        return await this.handleSymptomCheck(message, user);

      case 'menstrual_health':
        return await this.handleMenstrualHealth(message, user);

      case 'contraception':
        return await this.handleContraception(message, user);

      case 'sti_information':
        return await this.handleSTIInformation(message, user);

      default:
        return await this.handleGeneralQuery(message, user, conversationId);
    }
  }

  private async handleClinicSearch(
    message: string,
    user: any,
  ): Promise<string> {
    // Try to get user's lat/lng
    const userLocation = await this.userService.getUserLocation(user.id);
    if (userLocation && userLocation.lat && userLocation.lng) {
      // Use Google Maps for real search
      const clinics = await this.clinicService.searchNearbyClinicsGoogleMaps(
        userLocation.lat,
        userLocation.lng,
        5000,
      );
      if (clinics.length === 0) {
        return `I couldn't find any clinics near your location. Please try again later or provide a different location.`;
      }
      const clinicList = clinics
        .slice(0, 3)
        .map(
          (clinic, index) =>
            `${index + 1}. ${clinic.name}\n📍 ${clinic.address}\n⭐ ${clinic.rating || 'N/A'}`,
        )
        .join('\n\n');
      return `Here are some nearby healthcare facilities:\n\n${clinicList}\n\nWould you like more information about any of these clinics? 🏥`;
    } else {
      // Ask user for location
      return `To find clinics near you, please share your location (e.g., send your city or type 'My location is 6.5244, 3.3792').`;
    }
  }

  private async handleSymptomCheck(
    message: string,
    user: any,
  ): Promise<string> {
    const symptoms = this.extractSymptoms(message);

    if (symptoms.length === 0) {
      return `I can help assess symptoms you might be experiencing. Could you describe what you're feeling? For example: pain, unusual discharge, itching, etc. 🩺\n\nRemember, I provide general guidance - for proper diagnosis, please consult a healthcare provider.`;
    }

    const analysis = await this.openAi.analyzeSymptoms(symptoms, { user });

    let response = `${analysis.assessment}\n\n`;

    if (analysis.urgency === 'high') {
      response += `⚠️ These symptoms may need prompt medical attention. Please consider seeing a healthcare provider soon.\n\n`;
    }

    response += `💡 General recommendations:\n`;
    analysis.recommendations.forEach((rec, index) => {
      response += `${index + 1}. ${rec}\n`;
    });

    if (analysis.referralNeeded) {
      response += `\nWould you like me to help you find nearby clinics? 🏥`;
    }

    return response;
  }

  private async handleMenstrualHealth(
    message: string,
    user: any,
  ): Promise<string> {
    // Get recent conversation context
    const recentMessages = await this.getRecentMessages(user.id, 5);
    const context = { user, recentMessages };

    const messages: ChatCompletionMessageParam[] = [
      { role: 'user', content: message },
    ];

    return await this.openAi.generateResponse(messages, context);
  }

  private async handleContraception(
    message: string,
    user: any,
  ): Promise<string> {
    const recentMessages = await this.getRecentMessages(user.id, 5);
    const context = { user, recentMessages, topic: 'contraception' };

    const messages: ChatCompletionMessageParam[] = [
      { role: 'user', content: message },
    ];

    return await this.openAi.generateResponse(messages, context);
  }

  private async handleSTIInformation(
    message: string,
    user: any,
  ): Promise<string> {
    const recentMessages = await this.getRecentMessages(user.id, 5);
    const context = {
      user,
      recentMessages,
      topic: 'sti_prevention_and_treatment',
    };

    const messages: ChatCompletionMessageParam[] = [
      { role: 'user', content: message },
    ];

    return await this.openAi.generateResponse(messages, context);
  }

  private async handleGeneralQuery(
    message: string,
    user: any,
    conversationId: string,
  ): Promise<string> {
    const recentMessages = await this.getRecentMessages(user.id, 10);
    const context = { user, recentMessages };

    const messages: ChatCompletionMessageParam[] = recentMessages.map(
      (msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
      }),
    );

    messages.push({ role: 'user', content: message });

    return await this.openAi.generateResponse(messages, context);
  }

  private extractSymptoms(message: string): string[] {
    const symptomKeywords = [
      'pain',
      'discharge',
      'itching',
      'burning',
      'bleeding',
      'cramps',
      'nausea',
      'fever',
      'rash',
      'swelling',
      'odor',
      'unusual',
    ];

    const lowerMessage = message.toLowerCase();
    return symptomKeywords.filter((symptom) => lowerMessage.includes(symptom));
  }

  private async getOrCreateConversation(userId: string) {
    // Try to find an active conversation from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          userId,
          sessionId: `session_${Date.now()}`,
        },
      });
    }

    return conversation;
  }

  private async saveMessage(
    conversationId: string,
    content: string,
    role: 'USER' | 'ASSISTANT',
  ): Promise<void> {
    await this.prisma.message.create({
      data: {
        conversationId,
        content,
        role,
        timestamp: new Date(),
      },
    });
  }

  private async getRecentMessages(userId: string, limit: number = 10) {
    return await this.prisma.message.findMany({
      where: {
        conversation: {
          userId,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      select: {
        content: true,
        role: true,
        timestamp: true,
      },
    });
  }
}
