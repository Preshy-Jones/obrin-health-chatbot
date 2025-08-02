import { Injectable } from '@nestjs/common';
import { HealthService } from './health.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class MenstrualTrackingService {
  constructor(
    private healthService: HealthService,
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
      lowerMessage.includes('started period')
    ) {
      const dateMatch = message.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const periodDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
        );
        await this.healthService.updateLastPeriod(userId, periodDate);

        // Ask for cycle length if not set
        const profile = await this.healthService.getHealthProfile(userId);
        if (!profile?.cycleLength) {
          return `Thanks! I've recorded your last period as ${periodDate.toLocaleDateString()}. 
          
What's your average cycle length (days between periods)? This helps me predict your next period.`;
        }

        const nextPeriod = await this.healthService.predictNextPeriod(userId);
        if (nextPeriod) {
          return `Thanks! I've recorded your last period. Based on your cycle, your next period is expected around ${nextPeriod.toLocaleDateString()}. 

I'll send you a reminder a few days before! 📅`;
        }
      } else {
        return `I'd like to help you track your period. When did your last period start? Please use the format DD/MM/YYYY (e.g., 15/01/2024).`;
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
            return `Perfect! I've set your cycle length to ${cycleLength} days. Your next period is expected around ${nextPeriod.toLocaleDateString()}. 

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
      lowerMessage.includes('when period')
    ) {
      const nextPeriod = await this.healthService.predictNextPeriod(userId);
      if (nextPeriod) {
        const daysUntil = Math.ceil(
          (nextPeriod.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntil > 0) {
          return `Based on your cycle, your next period is expected in about ${daysUntil} days (around ${nextPeriod.toLocaleDateString()}). 

Remember to have supplies ready! 🩸`;
        } else if (daysUntil >= -7) {
          return `You're currently in your expected period window (${nextPeriod.toLocaleDateString()}). 

If you haven't started yet, don't worry - cycles can vary!`;
        } else {
          return `Your last predicted period was ${nextPeriod.toLocaleDateString()}. 

If you haven't had your period yet, would you like to update your last period date?`;
        }
      } else {
        return `I don't have enough information to predict your next period. 

Could you tell me:
1. When did your last period start? (DD/MM/YYYY)
2. What's your average cycle length? (days between periods)`;
      }
    }

    // General period tracking help
    return `I can help you track your menstrual cycle! Here's what I can do:

📅 Record your last period date
📊 Predict your next period
⏰ Send you reminders
📝 Track cycle length

Just tell me when your last period started (DD/MM/YYYY) or ask about your next period!`;
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
