import { Injectable } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { HealthService } from '../health/health.service';
import { PrismaService } from 'prisma/prisma.service';
import { OpenaiService } from 'src/openai/openai.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { ClinicService } from 'src/clinic/clinic.service';
import { LocationService } from 'src/clinic/location.service';
import { MenstrualTrackingService } from '../health/menstrual-tracking.service';
import { SymptomCheckerService } from '../health/symptom-checker.service';
import {
  ConversationStateService,
  ConversationState,
} from './conversation-state.service';
import { ConversationalResponseService } from './conversational-response.service';
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
    private locationService: LocationService,
    private menstrualTrackingService: MenstrualTrackingService,
    private symptomCheckerService: SymptomCheckerService,
    private conversationStateService: ConversationStateService,
    private conversationalResponseService: ConversationalResponseService,
  ) {}

  async processIncomingMessage(messageData: IncomingMessage): Promise<void> {
    const { phoneNumber, message } = messageData;

    try {
      // Get or create user
      const user = await this.userService.findOrCreateUser(phoneNumber);

      // Generate conversation ID (using phone number as conversation identifier)
      const conversationId = `conv_${phoneNumber}`;

      // Get or create conversation state
      let conversationState =
        await this.conversationStateService.getConversationState(
          user.id,
          conversationId,
        );

      // Enhanced location parsing - supports multiple formats
      const location = await this.locationService.parseLocationInput(message);
      if (location) {
        await this.userService.updateUserLocation(
          user.id,
          location.lat,
          location.lng,
          location.city,
        );
        conversationState.context.location = location;
        await this.conversationStateService.updateConversationState(
          conversationState,
        );

        const locationDisplay = this.locationService.formatLocation(location);
        const response = `Thanks! I have saved your location as ${locationDisplay}. Now I can find clinics near you. 🏥`;
        await this.whatsapp.sendMessage(phoneNumber, response);
        return;
      }

      // Analyze message and update conversation state
      conversationState =
        await this.conversationStateService.analyzeMessageAndUpdateState(
          message,
          conversationState,
        );

      // Generate conversational response
      const conversationalResponse =
        await this.conversationalResponseService.generateConversationalResponse(
          message,
          conversationState,
          user.locationLat && user.locationLng
            ? {
                lat: user.locationLat,
                lng: user.locationLng,
                city: user.city,
                state: user.city ? 'Lagos' : undefined,
                country: 'Nigeria',
              }
            : conversationState.context.location || undefined,
        );

      // Update conversation state
      await this.conversationStateService.updateConversationState(
        conversationState,
      );

      // Get or create conversation for message history
      const conversation = await this.getOrCreateConversation(user.id);

      // Save user message
      await this.saveMessage(conversation.id, message, 'USER');

      // If conversational response is available, use it
      if (conversationalResponse.response) {
        // Save assistant response
        await this.saveMessage(
          conversation.id,
          conversationalResponse.response,
          'ASSISTANT',
        );

        // Send conversational response
        await this.whatsapp.sendMessage(
          phoneNumber,
          conversationalResponse.response,
        );

        // If this is a clinic search request, provide actual clinic results
        if (
          conversationState.stage === 'clinic_search' &&
          conversationState.context.serviceType
        ) {
          const clinicResults = await this.handleClinicSearch(message, user);
          if (clinicResults) {
            await this.saveMessage(conversation.id, clinicResults, 'ASSISTANT');
            await this.whatsapp.sendMessage(phoneNumber, clinicResults);
            return;
          }
        }

        return;
      }

      // Fallback to original intent-based processing
      const intent = await this.detectIntent(message, user);
      const response = await this.generateContextualResponse(
        message,
        intent,
        user,
        conversation.id,
      );

      // Save assistant response
      await this.saveMessage(conversation.id, response, 'ASSISTANT');

      console.log('response', response);
      console.log('intent', intent);
      console.log('user', user);
      console.log('conversation', conversation);
      console.log('message', message);
      console.log('phoneNumber', phoneNumber);

      // Send response via WhatsApp
      await this.whatsapp.sendMessage(phoneNumber, response);

      return;
    } catch (error) {
      console.error('Error processing message:', error);
      const errorResponse =
        "I'm sorry, I'm having some technical difficulties. Please try again in a moment. 🤖";
      await this.whatsapp.sendMessage(phoneNumber, errorResponse);
      return;
    }
  }

  private async detectIntent(message: string, user: any): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Emergency contraception
    if (
      lowerMessage.includes('condom broke') ||
      lowerMessage.includes('emergency contraception') ||
      lowerMessage.includes('morning after') ||
      lowerMessage.includes('unprotected sex')
    ) {
      return 'emergency_contraception';
    }

    // Pregnancy concerns
    if (
      lowerMessage.includes('pregnant') ||
      lowerMessage.includes('missed period') ||
      lowerMessage.includes('pregnancy test') ||
      lowerMessage.includes('am i pregnant')
    ) {
      return 'pregnancy_concern';
    }

    // STI symptoms and testing
    if (
      lowerMessage.includes('sti') ||
      lowerMessage.includes('std') ||
      lowerMessage.includes('infection') ||
      lowerMessage.includes('hiv test') ||
      lowerMessage.includes('burning') ||
      lowerMessage.includes('discharge') ||
      lowerMessage.includes('itching')
    ) {
      return 'sti_symptoms';
    }

    // Menstrual tracking
    if (
      lowerMessage.includes('period tracking') ||
      lowerMessage.includes('last period') ||
      lowerMessage.includes('cycle') ||
      lowerMessage.includes('menstrual')
    ) {
      return 'menstrual_tracking';
    }

    // Menopause symptoms
    if (
      lowerMessage.includes('hot flash') ||
      lowerMessage.includes('menopause') ||
      lowerMessage.includes('dryness') ||
      lowerMessage.includes('mood swing') ||
      lowerMessage.includes('memory loss')
    ) {
      return 'menopause_support';
    }

    // Clinic/location related
    if (
      lowerMessage.includes('clinic') ||
      lowerMessage.includes('hospital') ||
      lowerMessage.includes('doctor') ||
      lowerMessage.includes('pap smear') ||
      lowerMessage.includes('where to get')
    ) {
      return 'clinic_search';
    }

    // Symptom checking
    if (
      lowerMessage.includes('symptom') ||
      lowerMessage.includes('pain') ||
      lowerMessage.includes('unusual')
    ) {
      return 'symptom_check';
    }

    // Contraception
    if (
      lowerMessage.includes('contraception') ||
      lowerMessage.includes('birth control') ||
      lowerMessage.includes('pill') ||
      lowerMessage.includes('missed pills')
    ) {
      return 'contraception';
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

      case 'emergency_contraception':
        return await this.handleEmergencyContraception(message, user);

      case 'pregnancy_concern':
        return await this.handlePregnancyConcern(message, user);

      case 'sti_symptoms':
        return await this.handleSTISymptoms(message, user);

      case 'menstrual_tracking':
        return await this.handleMenstrualTracking(message, user);

      case 'menopause_support':
        return await this.handleMenopauseSupport(message, user);

      case 'clinic_search':
        return await this.handleClinicSearch(message, user);

      case 'symptom_check':
        return await this.handleSymptomCheck(message, user);

      case 'contraception':
        return await this.handleContraception(message, user);

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
      // Ask user for location with enhanced instructions
      return this.locationService.getLocationInstructions();
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

    // Use the specialized symptom checker service
    const assessment = await this.symptomCheckerService.assessGeneralSymptoms(
      symptoms,
      user.id,
    );
    const userLocation = await this.userService.getUserLocation(user.id);

    return await this.symptomCheckerService.generateSymptomResponse(
      assessment,
      userLocation,
    );
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

  private async handleEmergencyContraception(
    message: string,
    user: any,
  ): Promise<string> {
    const recentMessages = await this.getRecentMessages(user.id, 5);
    const context = {
      user,
      recentMessages,
      topic: 'emergency_contraception',
      urgency: 'high',
    };

    const messages: ChatCompletionMessageParam[] = [
      { role: 'user', content: message },
    ];

    return await this.openAi.generateResponse(messages, context);
  }

  private async handlePregnancyConcern(
    message: string,
    user: any,
  ): Promise<string> {
    const recentMessages = await this.getRecentMessages(user.id, 5);
    const context = {
      user,
      recentMessages,
      topic: 'pregnancy_concern',
      urgency: 'medium',
    };

    const messages: ChatCompletionMessageParam[] = [
      { role: 'user', content: message },
    ];

    return await this.openAi.generateResponse(messages, context);
  }

  private async handleSTISymptoms(message: string, user: any): Promise<string> {
    const symptoms = this.extractSymptoms(message);

    if (symptoms.length === 0) {
      return `I can help assess STI-related symptoms. Could you describe what you're experiencing? For example: unusual discharge, burning during urination, itching, etc. 🩺\n\nRemember, many STIs are treatable and nothing to be ashamed of.`;
    }

    // Use the specialized STI symptom checker
    const assessment = await this.symptomCheckerService.assessSTISymptoms(
      symptoms,
      user.id,
    );
    const userLocation = await this.userService.getUserLocation(user.id);

    return await this.symptomCheckerService.generateSymptomResponse(
      assessment,
      userLocation,
    );
  }

  private async handleMenstrualTracking(
    message: string,
    user: any,
  ): Promise<string> {
    // Use the specialized menstrual tracking service for better functionality
    return await this.menstrualTrackingService.handlePeriodTrackingMessage(
      message,
      user.id,
      user.phoneNumber,
    );
  }

  private async handleMenopauseSupport(
    message: string,
    user: any,
  ): Promise<string> {
    const recentMessages = await this.getRecentMessages(user.id, 5);
    const context = {
      user,
      recentMessages,
      topic: 'menopause_support',
    };

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
