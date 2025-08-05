import { Injectable } from '@nestjs/common';
import { ConversationState } from './conversation-state.service';
import { LocationService } from '../clinic/location.service';
import { ClinicService } from '../clinic/clinic.service';
import { SymptomCheckerService } from '../health/symptom-checker.service';

@Injectable()
export class ConversationalResponseService {
  constructor(
    private locationService: LocationService,
    private clinicService: ClinicService,
    private symptomCheckerService: SymptomCheckerService,
  ) {}

  /**
   * Generate contextual response based on conversation state
   */
  async generateConversationalResponse(
    message: string,
    state: ConversationState,
    userLocation?: any,
  ): Promise<{ response: string; followUp?: string[] }> {
    // Update state context with location if available
    if (userLocation) {
      state.context.location = userLocation;
    }

    // Generate response based on conversation stage
    switch (state.stage) {
      case 'greeting':
        return this.handleGreeting(message, state);

      case 'location_setup':
        return this.handleLocationSetup(message, state);

      case 'health_assessment':
        return this.handleHealthAssessment(message, state);

      case 'clinic_search':
        return this.handleClinicSearch(message, state);

      case 'symptom_check':
        return this.handleSymptomCheck(message, state);

      case 'service_selection':
        return this.handleServiceSelection(message, state);

      case 'clinic_details':
        return this.handleClinicDetails(message, state);

      case 'follow_up':
        return this.handleFollowUp(message, state);

      default:
        return this.handleGeneralQuery(message, state);
    }
  }

  /**
   * Handle greeting stage
   */
  private async handleGreeting(
    message: string,
    state: ConversationState,
  ): Promise<{ response: string; followUp?: string[] }> {
    const greetings = [
      "Hello! 👋 I'm your Obrin Health assistant. How can I help you today?",
      "Hi there! 🌸 I'm here to support your health journey. What brings you here?",
      "Welcome back! 💙 I'm ready to help with any health questions you have.",
    ];

    // Check if returning user with location
    if (state.context.location) {
      const locationDisplay = this.locationService.formatLocation(
        state.context.location,
      );
      return {
        response: `Welcome back! I remember you're in ${locationDisplay}. How can I help you today? 💙`,
        followUp: [
          'What type of health services are you looking for?',
          'Do you need help finding a clinic?',
          'Are you experiencing any symptoms?',
        ],
      };
    }

    return {
      response: greetings[Math.floor(Math.random() * greetings.length)],
      followUp: [
        'What type of health services are you looking for?',
        'Do you need help finding a clinic?',
        'Are you experiencing any symptoms?',
      ],
    };
  }

  /**
   * Handle location setup stage
   */
  private async handleLocationSetup(
    message: string,
    state: ConversationState,
  ): Promise<{ response: string; followUp?: string[] }> {
    // Try to parse location from message
    const location = await this.locationService.parseLocationInput(message);

    if (location) {
      state.context.location = location;
      const locationDisplay = this.locationService.formatLocation(location);

      return {
        response: `Perfect! I have your location as ${locationDisplay}. 

What type of health services are you looking for today?
• 🏥 General clinics
• 🩺 Specialized care (gynecology, STI testing, etc.)
• 💊 Emergency services
• 📋 Health information`,
        followUp: [
          'What type of health services do you need?',
          'Are you looking for general or specialized care?',
          'Do you have any specific symptoms?',
        ],
      };
    }

    return {
      response: this.locationService.getLocationInstructions(),
      followUp: [
        'You can say "I\'m in Lagos" or "Ogudu area"',
        'Or share coordinates like "6.6051, 3.3958"',
      ],
    };
  }

  /**
   * Handle health assessment stage
   */
  private async handleHealthAssessment(
    message: string,
    state: ConversationState,
  ): Promise<{ response: string; followUp?: string[] }> {
    if (state.context.symptoms && state.context.symptoms.length > 0) {
      return {
        response: `I understand you're experiencing ${state.context.symptoms.join(', ')}. 

To help you better, could you tell me:
• How long have you had these symptoms?
• Are they mild, moderate, or severe?
• Have you experienced anything like this before?

This will help me provide more accurate guidance. 🤔`,
        followUp: [
          'How long have you had these symptoms?',
          'Are the symptoms mild, moderate, or severe?',
          'Would you like me to help you find a clinic?',
        ],
      };
    }

    return {
      response: `I'm here to help assess your health concerns. 

Could you describe what you're experiencing? For example:
• "I have pain during urination"
• "Unusual discharge"
• "Missed my period"
• "Need emergency contraception"

Don't worry - I'm here to help, not judge. 💙`,
      followUp: [
        'What symptoms are you experiencing?',
        'How long have you had these symptoms?',
        'Would you like me to help you find a clinic?',
      ],
    };
  }

  /**
   * Handle clinic search stage
   */
  private async handleClinicSearch(
    message: string,
    state: ConversationState,
  ): Promise<{ response: string; followUp?: string[] }> {
    if (state.context.serviceType) {
      return {
        response: `Great! I found some ${state.context.serviceType} clinics near you. 

Would you like me to:
• 📍 Show you the closest 3 clinics
• ⭐ Show only highly-rated clinics
• 💰 Show clinics with affordable services
• 📞 Get contact information for specific clinics

Just let me know what's most important to you!`,
        followUp: [
          'Would you like the closest clinics or highly-rated ones?',
          'Do you need emergency services?',
          'Would you like information about costs?',
        ],
      };
    }

    return {
      response: `I can help you find the right clinic! 

What type of services are you looking for?
• 🏥 General health check
• 🩺 Women's health (gynecology, family planning)
• 🔬 STI testing and treatment
• 🤰 Pregnancy care
• 💊 Emergency contraception
• 🧠 Mental health support

Tell me what you need, and I'll find the best options for you!`,
      followUp: [
        'What type of services are you looking for?',
        'Do you prefer a specific area?',
        'Are you looking for affordable options?',
      ],
    };
  }

  /**
   * Handle symptom check stage
   */
  private async handleSymptomCheck(
    message: string,
    state: ConversationState,
  ): Promise<{ response: string; followUp?: string[] }> {
    if (state.context.urgency === 'high') {
      return {
        response: `⚠️ Based on your symptoms, this may need prompt attention. 

I recommend:
1. 🚨 Seek medical care within 24 hours
2. 📞 Call emergency services if symptoms worsen
3. 🏥 Visit the nearest emergency clinic

Would you like me to:
• Find the closest emergency clinic?
• Provide more information about your symptoms?
• Help you prepare for your medical visit?

Your health is important - let's get you the care you need! 💙`,
        followUp: [
          'Would you like me to find the closest emergency clinic?',
          'Do you need more information about your symptoms?',
          'Would you like help preparing for your medical visit?',
        ],
      };
    }

    return {
      response: `I understand your concerns about ${state.context.symptoms?.join(', ')}. 

Let me ask a few questions to better assess your situation:
• When did these symptoms start?
• Are they getting better, worse, or staying the same?
• Do you have any other symptoms?
• Have you taken any medications recently?

This will help me provide the most accurate guidance. 🤔`,
      followUp: [
        'When did these symptoms start?',
        'Are they getting better, worse, or staying the same?',
        'Would you like me to help you find a clinic?',
      ],
    };
  }

  /**
   * Handle service selection stage
   */
  private async handleServiceSelection(
    message: string,
    state: ConversationState,
  ): Promise<{ response: string; followUp?: string[] }> {
    // This would integrate with the clinic service to get actual results
    const serviceType = state.context.serviceType || 'healthcare';

    return {
      response: `Perfect! I'll help you find ${serviceType} services. 

Based on your location, I can:
• 📍 Show you the closest clinics
• ⭐ Show highly-rated options
• 💰 Show affordable services
• 📞 Provide contact information

What's most important to you - proximity, quality, or cost?`,
      followUp: [
        'Would you like the closest clinics or highly-rated ones?',
        'Do you need information about costs?',
        'Would you like contact information for specific clinics?',
      ],
    };
  }

  /**
   * Handle clinic details stage
   */
  private async handleClinicDetails(
    message: string,
    state: ConversationState,
  ): Promise<{ response: string; followUp?: string[] }> {
    return {
      response: `I'd be happy to provide more details about the clinics! 

What specific information would you like?
• 📞 Contact information and phone numbers
• 🗺️ Directions and how to get there
• 💰 Consultation fees and costs
• 🕒 Operating hours and availability
• 🏥 Services offered and specializations

Just let me know what's most helpful for you!`,
      followUp: [
        'Would you like contact information?',
        'Do you need directions to the clinic?',
        'Would you like to know about their services?',
      ],
    };
  }

  /**
   * Handle follow-up stage
   */
  private async handleFollowUp(
    message: string,
    state: ConversationState,
  ): Promise<{ response: string; followUp?: string[] }> {
    return {
      response: `Thank you for sharing that information! 

Based on what you've told me, here's what I recommend:
${this.generateRecommendations(state)}

Is there anything else I can help you with today? Maybe:
• 📚 Information about your health concern?
• 🏥 Finding other types of clinics?
• 📅 Setting up follow-up reminders?
• 💬 General health questions?

I'm here whenever you need support! 🌸`,
      followUp: [
        'Would you like information about your health concern?',
        'Do you need help finding other types of clinics?',
        'Would you like to set up follow-up reminders?',
      ],
    };
  }

  /**
   * Handle general queries
   */
  private async handleGeneralQuery(
    message: string,
    state: ConversationState,
  ): Promise<{ response: string; followUp?: string[] }> {
    return {
      response: `I'm here to help with any health-related questions you have! 

You can ask me about:
• 🏥 Finding clinics and hospitals
• 🩺 Health symptoms and concerns
• 📚 Sexual and reproductive health information
• 💊 Emergency contraception
• 📅 Menstrual tracking
• 🧠 Mental health support

What would you like to know more about? 💙`,
      followUp: [
        'What type of health services are you looking for?',
        'Do you need help finding a clinic?',
        'Are you experiencing any symptoms?',
      ],
    };
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(state: ConversationState): string {
    if (state.context.urgency === 'high') {
      return `🚨 **Immediate Action Recommended:**
• Seek medical care within 24 hours
• Monitor symptoms closely
• Contact emergency services if symptoms worsen`;
    }

    if (state.context.serviceType) {
      return `🏥 **Clinic Recommendations:**
• I found ${state.context.serviceType} clinics near you
• Consider factors like distance, ratings, and cost
• Don't hesitate to ask questions during your visit`;
    }

    return `💡 **General Guidance:**
• Your symptoms are common and treatable
• Early intervention leads to better outcomes
• Don't hesitate to seek professional care`;
  }
}
