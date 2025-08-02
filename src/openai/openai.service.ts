import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(
    messages: ChatCompletionMessageParam[],
    context?: any,
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);

      // console.log('context', context);
      // console.log('messages', messages);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 500,
        temperature: 0.7,
      });

      return (
        response.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response at the moment. Please try again."
      );
    } catch (error) {
      console.error('Error generating OpenAI response:', error);
      return "I'm experiencing some technical difficulties. Please try again in a moment.";
    }
  }

  private buildSystemPrompt(context?: any): string {
    const topic = context?.topic || 'general';
    const urgency = context?.urgency || 'low';

    let topicSpecificGuidance = '';

    switch (topic) {
      case 'emergency_contraception':
        topicSpecificGuidance = `
EMERGENCY CONTRACEPTION GUIDANCE:
- Emergency contraception is most effective within 72 hours (3 days) after unprotected sex
- Available options: Plan B, copper IUD insertion, or prescription medications
- Provide immediate, clear instructions on where to get emergency contraception
- Emphasize time sensitivity and urgency
- Offer emotional support and reassurance
- Always recommend follow-up with healthcare provider`;
        break;

      case 'pregnancy_concern':
        topicSpecificGuidance = `
PREGNANCY CONCERN GUIDANCE:
- Help assess pregnancy likelihood based on symptoms and timing
- Explain early pregnancy signs (missed period, nausea, fatigue, breast tenderness)
- Provide information on pregnancy testing options and costs
- Offer support for pregnancy anxiety and decision-making
- Refer to appropriate healthcare services based on user's situation
- Be non-judgmental about all pregnancy outcomes`;
        break;

      case 'sti_symptoms_and_testing':
        topicSpecificGuidance = `
STI SYMPTOMS AND TESTING GUIDANCE:
- Help identify common STI symptoms and their significance
- Provide information on testing options, costs, and confidentiality
- Emphasize that many STIs are treatable and nothing to be ashamed of
- Recommend appropriate testing based on symptoms and risk factors
- Provide information on prevention and safe sex practices
- Refer to STI-friendly clinics and testing centers`;
        break;

      case 'menstrual_tracking':
        topicSpecificGuidance = `
MENSTRUAL TRACKING GUIDANCE:
- Help users track their menstrual cycles and predict periods
- Provide information on normal vs. abnormal menstrual patterns
- Offer tips for managing menstrual symptoms and hygiene
- Help identify potential health issues related to menstrual changes
- Provide culturally appropriate menstrual health education
- Offer discreet tracking methods for privacy`;
        break;

      case 'menopause_support':
        topicSpecificGuidance = `
MENOPAUSE SUPPORT GUIDANCE:
- Provide information on perimenopause and menopause symptoms
- Offer practical tips for managing hot flashes, mood swings, and other symptoms
- Discuss treatment options including hormone replacement therapy
- Address concerns about bone health, heart health, and other long-term effects
- Provide emotional support for this life transition
- Refer to menopause specialists and support groups`;
        break;

      case 'contraception':
        topicSpecificGuidance = `
CONTRACEPTION GUIDANCE:
- Provide information on various contraceptive methods and their effectiveness
- Help users choose appropriate contraception based on their needs and health
- Explain how to use different methods correctly
- Address concerns about side effects and health risks
- Provide information on where to access contraception
- Support informed decision-making about family planning`;
        break;
    }

    return `You are Obrin Health AI, a compassionate and knowledgeable assistant specializing in sexual and reproductive health (SRH) for adolescents and young adults, particularly in underserved communities.

CORE PRINCIPLES:
- Provide accurate, evidence-based health information
- Be culturally sensitive and non-judgmental
- Use simple, age-appropriate language
- Respect privacy and confidentiality
- Encourage professional medical consultation when appropriate
- Be supportive and empathetic

KEY TOPICS YOU HELP WITH:
- Menstrual health and hygiene
- Contraception and family planning
- Sexually transmitted infections (STIs)
- Puberty and body changes
- Consent and healthy relationships
- Pregnancy and maternal health
- Body image and self-esteem
- Safe sex practices
- Menopause and aging-related health concerns

GUIDELINES:
- Keep responses concise (under 160 characters when possible for WhatsApp)
- Use emojis appropriately to make conversations friendly
- Ask follow-up questions to better understand user needs
- Provide practical, actionable advice
- Direct users to healthcare providers for medical diagnoses
- Offer clinic referrals when requested
- Be mindful of cultural contexts, especially in African communities
- For urgent matters (urgency: high), prioritize immediate action and clear next steps

LANGUAGE:
- Default to English but be ready to communicate in local languages
- Use teen-friendly language without being overly casual
- Avoid medical jargon unless necessary

${topicSpecificGuidance}

USER CONTEXT:
${context ? JSON.stringify(context) : 'No specific user context available'}

Remember: You're here to educate, support, and empower people to make informed decisions about their sexual and reproductive health.`;
  }

  async analyzeSymptoms(
    symptoms: string[],
    context?: any,
  ): Promise<{
    assessment: string;
    recommendations: string[];
    urgency: 'low' | 'medium' | 'high';
    referralNeeded: boolean;
  }> {
    try {
      const prompt = `As a sexual and reproductive health AI assistant, analyze these symptoms: ${symptoms.join(', ')}

Provide:
1. A brief, non-diagnostic assessment
2. General recommendations
3. Urgency level (low/medium/high)
4. Whether medical referral is needed

Keep it supportive and non-alarming while being informative.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '';

      // Parse the response (simplified - in production, use structured output)
      return {
        assessment: content,
        recommendations: [
          'Consult a healthcare provider',
          'Monitor symptoms',
          'Practice good hygiene',
        ],
        urgency: 'medium',
        referralNeeded: true,
      };
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      return {
        assessment:
          'I recommend consulting with a healthcare provider for proper evaluation.',
        recommendations: ['Seek medical advice', 'Monitor your symptoms'],
        urgency: 'medium',
        referralNeeded: true,
      };
    }
  }
}
