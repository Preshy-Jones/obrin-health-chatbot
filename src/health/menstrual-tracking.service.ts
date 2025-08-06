import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { HealthService } from './health.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class MenstrualTrackingService {
  constructor(
    private healthService: HealthService,
    @Inject(forwardRef(() => WhatsappService))
    private whatsappService: WhatsappService,
  ) {}

  async handlePeriodTrackingMessage(
    message: string,
    userId: string,
    phoneNumber: string,
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Check if user is setting their last period date
    if (
      lowerMessage.includes('last period') ||
      lowerMessage.includes('started period') ||
      lowerMessage.includes('period started')
    ) {
      const dateMatch = message.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const periodDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
        );

        // Extract period length and flow intensity if mentioned
        let periodLength: number | undefined;
        let flowIntensity: string | undefined;

        // Check for period length (e.g., "5 days", "lasted 4 days")
        const lengthMatch = message.match(/(\d+)\s*days?/i);
        if (lengthMatch) {
          periodLength = parseInt(lengthMatch[1]);
        }

        // Check for flow intensity
        if (
          lowerMessage.includes('light') ||
          lowerMessage.includes('light flow')
        ) {
          flowIntensity = 'Light';
        } else if (
          lowerMessage.includes('heavy') ||
          lowerMessage.includes('heavy flow')
        ) {
          flowIntensity = 'Heavy';
        } else if (
          lowerMessage.includes('medium') ||
          lowerMessage.includes('normal')
        ) {
          flowIntensity = 'Medium';
        }

        await this.healthService.updateLastPeriod(
          userId,
          periodDate,
          periodLength,
          flowIntensity,
        );

        // Ask for cycle length if not set
        const profile = await this.healthService.getHealthProfile(userId);
        if (!profile?.cycleLength) {
          return `Thanks! I've recorded your last period as ${periodDate.toLocaleDateString()}. 
          
What's your average cycle length (days between periods)? This helps me predict your next period more accurately.`;
        }

        const prediction = await this.healthService.predictNextPeriod(userId);
        if (prediction) {
          const daysUntil = Math.ceil(
            (prediction.date.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );

          let response = `Thanks! I've recorded your last period. Based on your cycle data, your next period is expected around ${prediction.date.toLocaleDateString()} (in about ${daysUntil} days). 

Confidence: ${prediction.confidence}% 📊`;

          if (prediction.fertilityWindow) {
            const fertilityStart =
              prediction.fertilityWindow.start.toLocaleDateString();
            const fertilityEnd =
              prediction.fertilityWindow.end.toLocaleDateString();
            response += `\n\n🌱 Fertility window: ${fertilityStart} - ${fertilityEnd}`;
          }

          response += `\n\nI'll send you a reminder ${(profile as any).reminderDays || 3} days before! 📅`;
          return response;
        }
      } else {
        return `I'd like to help you track your period. When did your last period start? Please use the format DD/MM/YYYY (e.g., 15/01/2024).

You can also include:
• How long it lasted (e.g., "5 days")
• Flow intensity (light, medium, heavy)`;
      }
    }

    // Check if user is setting cycle length
    if (lowerMessage.includes('cycle') && lowerMessage.includes('day')) {
      const numberMatch = message.match(/(\d+)/);
      if (numberMatch) {
        const cycleLength = parseInt(numberMatch[1]);
        if (cycleLength >= 21 && cycleLength <= 35) {
          await this.healthService.updateCycleLength(userId, cycleLength);
          const nextPeriod = await this.healthService.predictNextPeriod(userId);
          if (nextPeriod) {
            return `Perfect! I've set your cycle length to ${cycleLength} days. Your next period is expected around ${nextPeriod.date.toLocaleDateString()}. 

I'll send you a reminder 3 days before! 📅`;
          }
        } else {
          return `A typical menstrual cycle is between 21-35 days. Please enter a number in that range.`;
        }
      }
    }

    // Check if user is asking about next period
    if (
      lowerMessage.includes('next period') ||
      lowerMessage.includes('when period') ||
      lowerMessage.includes('fertility') ||
      lowerMessage.includes('ovulation')
    ) {
      const prediction = await this.healthService.predictNextPeriod(userId);
      if (prediction) {
        const daysUntil = Math.ceil(
          (prediction.date.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysUntil > 0) {
          let response = `Based on your cycle data, your next period is expected in about ${daysUntil} days (around ${prediction.date.toLocaleDateString()}). 

Confidence: ${prediction.confidence}% 📊

Remember to have supplies ready! 🩸`;

          if (prediction.fertilityWindow) {
            const fertilityStart =
              prediction.fertilityWindow.start.toLocaleDateString();
            const fertilityEnd =
              prediction.fertilityWindow.end.toLocaleDateString();
            response += `\n\n🌱 Fertility window: ${fertilityStart} - ${fertilityEnd}`;
          }

          return response;
        } else if (daysUntil >= -7) {
          return `You're currently in your expected period window (${prediction.date.toLocaleDateString()}). 

If you haven't started yet, don't worry - cycles can vary! Confidence: ${prediction.confidence}% 📊`;
        } else {
          return `Your last predicted period was ${prediction.date.toLocaleDateString()}. 

If you haven't had your period yet, would you like to update your last period date?`;
        }
      } else {
        return `I don't have enough information to predict your next period. 

Could you tell me:
1. When did your last period start? (DD/MM/YYYY)
2. What's your average cycle length? (days between periods)`;
      }
    }

    // Check for period length setting
    if (
      lowerMessage.includes('period length') ||
      (lowerMessage.includes('lasted') && lowerMessage.includes('days'))
    ) {
      const numberMatch = message.match(/(\d+)/);
      if (numberMatch) {
        const periodLength = parseInt(numberMatch[1]);
        if (periodLength >= 2 && periodLength <= 10) {
          await this.healthService.updatePeriodLength(userId, periodLength);
          return `Perfect! I've set your average period length to ${periodLength} days. This helps me provide more accurate predictions! 📊`;
        } else {
          return `A typical period lasts between 2-10 days. Please enter a number in that range.`;
        }
      }
    }

    // Check for flow intensity setting
    if (lowerMessage.includes('flow') || lowerMessage.includes('intensity')) {
      if (lowerMessage.includes('light')) {
        await this.healthService.updateFlowIntensity(userId, 'Light');
        return `I've recorded your flow intensity as Light. This helps me understand your cycle better! 🌸`;
      } else if (lowerMessage.includes('heavy')) {
        await this.healthService.updateFlowIntensity(userId, 'Heavy');
        return `I've recorded your flow intensity as Heavy. This helps me understand your cycle better! 💪`;
      } else if (
        lowerMessage.includes('medium') ||
        lowerMessage.includes('normal')
      ) {
        await this.healthService.updateFlowIntensity(userId, 'Medium');
        return `I've recorded your flow intensity as Medium. This helps me understand your cycle better! 📊`;
      }
    }

    // Check for reminder settings
    if (lowerMessage.includes('reminder') || lowerMessage.includes('notify')) {
      if (lowerMessage.includes('off') || lowerMessage.includes('disable')) {
        await this.healthService.updateReminderSettings(userId, false, 3);
        return `I've disabled your period reminders. You can enable them again anytime! 🔕`;
      } else if (
        lowerMessage.includes('on') ||
        lowerMessage.includes('enable')
      ) {
        await this.healthService.updateReminderSettings(userId, true, 3);
        return `I've enabled your period reminders. I'll notify you 3 days before your expected period! 🔔`;
      } else {
        const numberMatch = message.match(/(\d+)/);
        if (numberMatch) {
          const days = parseInt(numberMatch[1]);
          if (days >= 1 && days <= 7) {
            await this.healthService.updateReminderSettings(userId, true, days);
            return `I've set your period reminders to ${days} days before your expected period! 🔔`;
          }
        }
      }
    }

    // General period tracking help
    return `I can help you track your menstrual cycle! Here's what I can do:

📅 Record your last period date (DD/MM/YYYY)
📊 Predict your next period with confidence levels
🌱 Show fertility windows
⏰ Send you customizable reminders
📝 Track cycle length and flow intensity
📈 Analyze patterns from your history

Just tell me when your last period started or ask about your next period!`;
  }

  async sendPeriodReminder(
    phoneNumber: string,
    daysUntilPeriod: number,
  ): Promise<void> {
    let message = '';

    if (daysUntilPeriod === 3) {
      message = `🔔 Period Reminder: Your period is expected in 3 days! 
      
Make sure you have supplies ready. Remember to stay hydrated and get enough rest! 💪`;
    } else if (daysUntilPeriod === 1) {
      message = `🔔 Period Reminder: Your period is expected tomorrow! 
      
Have your supplies ready and consider taking it easy if you experience cramps. You've got this! 🌸`;
    } else if (daysUntilPeriod === 0) {
      message = `🔔 Period Reminder: Your period is expected today! 
      
Take care of yourself and remember that it's completely normal. Stay comfortable! 💕`;
    }

    if (message) {
      await this.whatsappService.sendMessage(phoneNumber, message);
    }
  }

  async checkAndSendReminders(): Promise<void> {
    // This would be called by a scheduled job to check all users and send reminders
    // Implementation would depend on your scheduling system (cron, etc.)
    console.log('Checking for period reminders...');
  }
}
