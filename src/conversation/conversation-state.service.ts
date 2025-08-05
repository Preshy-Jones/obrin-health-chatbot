import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

export interface ConversationState {
  stage:
    | 'greeting'
    | 'location_setup'
    | 'health_assessment'
    | 'clinic_search'
    | 'symptom_check'
    | 'follow_up'
    | 'service_selection'
    | 'clinic_details';
  context: {
    intent?: string;
    location?: any;
    symptoms?: string[];
    serviceType?: string;
    urgency?: 'low' | 'medium' | 'high';
    selectedClinic?: any;
    followUpQuestions?: string[];
    userPreferences?: {
      language?: string;
      communicationStyle?: 'formal' | 'casual' | 'friendly';
      privacyLevel?: 'high' | 'medium' | 'low';
    };
  };
  metadata: {
    conversationId: string;
    userId: string;
    lastUpdated: Date;
    messageCount: number;
  };
}

@Injectable()
export class ConversationStateService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create conversation state for a user
   */
  async getConversationState(
    userId: string,
    conversationId: string,
  ): Promise<ConversationState> {
    // Try to get existing state from database
    const existingState = await this.prisma.conversationState.findFirst({
      where: { userId, conversationId },
    });

    if (existingState) {
      return {
        stage: existingState.stage as any,
        context: existingState.context as any,
        metadata: {
          conversationId: existingState.conversationId,
          userId: existingState.userId,
          lastUpdated: existingState.updatedAt,
          messageCount: existingState.messageCount,
        },
      };
    }

    // Create new state
    const newState = this.initializeConversationState(userId, conversationId);
    await this.saveConversationState(newState);
    return newState;
  }

  /**
   * Update conversation state
   */
  async updateConversationState(state: ConversationState): Promise<void> {
    await this.saveConversationState(state);
  }

  /**
   * Save conversation state to database
   */
  private async saveConversationState(state: ConversationState): Promise<void> {
    await this.prisma.conversationState.upsert({
      where: {
        userId_conversationId: {
          userId: state.metadata.userId,
          conversationId: state.metadata.conversationId,
        },
      },
      update: {
        stage: state.stage,
        context: state.context as any,
        messageCount: state.metadata.messageCount,
        updatedAt: new Date(),
      },
      create: {
        userId: state.metadata.userId,
        conversationId: state.metadata.conversationId,
        stage: state.stage,
        context: state.context as any,
        messageCount: state.metadata.messageCount,
      },
    });
  }

  /**
   * Initialize new conversation state
   */
  private initializeConversationState(
    userId: string,
    conversationId: string,
  ): ConversationState {
    return {
      stage: 'greeting',
      context: {
        userPreferences: {
          communicationStyle: 'friendly',
          privacyLevel: 'medium',
        },
      },
      metadata: {
        conversationId,
        userId,
        lastUpdated: new Date(),
        messageCount: 0,
      },
    };
  }

  /**
   * Analyze message and update conversation state
   */
  async analyzeMessageAndUpdateState(
    message: string,
    currentState: ConversationState,
  ): Promise<ConversationState> {
    const lowerMessage = message.toLowerCase();
    const updatedState = { ...currentState };

    // Update message count
    updatedState.metadata.messageCount += 1;
    updatedState.metadata.lastUpdated = new Date();

    // Update stage based on message content
    if (this.isGreeting(lowerMessage)) {
      updatedState.stage = 'greeting';
    } else if (this.isLocationRequest(lowerMessage)) {
      updatedState.stage = 'location_setup';
    } else if (this.isHealthAssessment(lowerMessage)) {
      updatedState.stage = 'health_assessment';
    } else if (this.isClinicSearch(lowerMessage)) {
      updatedState.stage = 'clinic_search';
    } else if (this.isSymptomCheck(lowerMessage)) {
      updatedState.stage = 'symptom_check';
    } else if (this.isServiceSelection(lowerMessage)) {
      updatedState.stage = 'service_selection';
    } else if (this.isClinicDetails(lowerMessage)) {
      updatedState.stage = 'clinic_details';
    }

    // Extract context from message
    this.extractContextFromMessage(message, updatedState);

    return updatedState;
  }

  /**
   * Check if message is a greeting
   */
  private isGreeting(message: string): boolean {
    const greetings = [
      'hello',
      'hi',
      'hey',
      'good morning',
      'good afternoon',
      'good evening',
    ];
    return greetings.some((greeting) => message.includes(greeting));
  }

  /**
   * Check if message is requesting location setup
   */
  private isLocationRequest(message: string): boolean {
    const locationKeywords = [
      'location',
      'where',
      'near',
      'in ',
      'area',
      'place',
    ];
    return locationKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * Check if message is about health assessment
   */
  private isHealthAssessment(message: string): boolean {
    const healthKeywords = [
      'symptom',
      'pain',
      'feel',
      'experiencing',
      'concern',
      'problem',
    ];
    return healthKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * Check if message is about clinic search
   */
  private isClinicSearch(message: string): boolean {
    const clinicKeywords = [
      'clinic',
      'hospital',
      'doctor',
      'medical',
      'healthcare',
      'treatment',
    ];
    return clinicKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * Check if message is about symptom checking
   */
  private isSymptomCheck(message: string): boolean {
    const symptomKeywords = [
      'sti',
      'std',
      'infection',
      'discharge',
      'burning',
      'itching',
    ];
    return symptomKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * Check if message is about service selection
   */
  private isServiceSelection(message: string): boolean {
    const serviceKeywords = [
      'gynecology',
      'family planning',
      'sti testing',
      'emergency',
      'contraception',
    ];
    return serviceKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * Check if message is requesting clinic details
   */
  private isClinicDetails(message: string): boolean {
    const detailKeywords = [
      'tell me more',
      'details',
      'information',
      'about',
      'contact',
      'phone',
    ];
    return detailKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * Extract context from message
   */
  private extractContextFromMessage(
    message: string,
    state: ConversationState,
  ): void {
    const lowerMessage = message.toLowerCase();

    // Extract urgency
    if (
      lowerMessage.includes('urgent') ||
      lowerMessage.includes('emergency') ||
      lowerMessage.includes('immediate')
    ) {
      state.context.urgency = 'high';
    } else if (
      lowerMessage.includes('soon') ||
      lowerMessage.includes('quick')
    ) {
      state.context.urgency = 'medium';
    } else {
      state.context.urgency = 'low';
    }

    // Extract service type
    if (
      lowerMessage.includes('gynecology') ||
      lowerMessage.includes('gynecology')
    ) {
      state.context.serviceType = 'gynecology';
    } else if (lowerMessage.includes('sti') || lowerMessage.includes('std')) {
      state.context.serviceType = 'sti_testing';
    } else if (
      lowerMessage.includes('family planning') ||
      lowerMessage.includes('contraception')
    ) {
      state.context.serviceType = 'family_planning';
    } else if (lowerMessage.includes('emergency contraception')) {
      state.context.serviceType = 'emergency_contraception';
    } else if (lowerMessage.includes('pregnancy')) {
      state.context.serviceType = 'pregnancy_care';
    }

    // Extract symptoms
    const symptoms = this.extractSymptoms(lowerMessage);
    if (symptoms.length > 0) {
      state.context.symptoms = symptoms;
    }
  }

  /**
   * Extract symptoms from message
   */
  private extractSymptoms(message: string): string[] {
    const symptomKeywords = [
      'pain',
      'discharge',
      'burning',
      'itching',
      'bleeding',
      'cramps',
      'fever',
      'swelling',
      'irregular',
      'missed period',
      'nausea',
      'fatigue',
      'headache',
      'back pain',
      'abdominal pain',
    ];

    return symptomKeywords.filter((symptom) => message.includes(symptom));
  }

  /**
   * Get follow-up questions based on current state
   */
  getFollowUpQuestions(state: ConversationState): string[] {
    switch (state.stage) {
      case 'greeting':
        return [
          'What type of health services are you looking for?',
          'Do you need help finding a clinic?',
          'Are you experiencing any symptoms?',
        ];

      case 'location_setup':
        return [
          'What type of health services do you need?',
          'Are you looking for general or specialized care?',
          'Do you have any specific symptoms?',
        ];

      case 'health_assessment':
        return [
          'How long have you had these symptoms?',
          'Are the symptoms mild, moderate, or severe?',
          'Would you like me to help you find a clinic?',
        ];

      case 'clinic_search':
        return [
          'What type of services are you looking for?',
          'Do you prefer a specific area?',
          'Are you looking for affordable options?',
        ];

      case 'service_selection':
        return [
          'Would you like the closest clinics or highly-rated ones?',
          'Do you need emergency services?',
          'Would you like information about costs?',
        ];

      case 'clinic_details':
        return [
          'Would you like contact information?',
          'Do you need directions to the clinic?',
          'Would you like to know about their services?',
        ];

      default:
        return [
          'How can I help you further?',
          'Do you have any other questions?',
          'Would you like information about other services?',
        ];
    }
  }

  /**
   * Reset conversation state
   */
  async resetConversationState(
    userId: string,
    conversationId: string,
  ): Promise<ConversationState> {
    const newState = this.initializeConversationState(userId, conversationId);
    await this.saveConversationState(newState);
    return newState;
  }
}
