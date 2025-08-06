import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateHealthProfile(userId: string, profileData: any) {
    const existingProfile = await this.prisma.healthProfile.findFirst({
      where: { userId },
    });

    if (existingProfile) {
      return await this.prisma.healthProfile.update({
        where: { id: existingProfile.id },
        data: { ...profileData, updatedAt: new Date() },
      });
    } else {
      return await this.prisma.healthProfile.create({
        data: { userId, ...profileData },
      });
    }
  }

  async getHealthProfile(userId: string) {
    return await this.prisma.healthProfile.findFirst({
      where: { userId },
    });
  }

  async trackSymptoms(userId: string, symptoms: string[]) {
    // This could be expanded to track symptoms over time
    const profile = await this.getHealthProfile(userId);
    if (profile) {
      return await this.prisma.healthProfile.update({
        where: { id: profile.id },
        data: {
          symptoms: [...new Set([...profile.symptoms, ...symptoms])],
          updatedAt: new Date(),
        },
      });
    }
  }

  async updateLastPeriod(
    userId: string,
    date: Date,
    periodLength?: number,
    flowIntensity?: string,
  ) {
    const profile = await this.getHealthProfile(userId);
    const periodData = {
      date: date.toISOString(),
      length: periodLength || 5, // Default 5 days
      intensity: flowIntensity || 'Medium',
    };

    if (profile) {
      // Update period history
      const periodHistory = (profile.periodHistory as any[]) || [];
      periodHistory.push(periodData);

      // Keep only last 12 periods for analysis
      if (periodHistory.length > 12) {
        periodHistory.splice(0, periodHistory.length - 12);
      }

      return await this.prisma.healthProfile.update({
        where: { id: profile.id },
        data: {
          lastPeriod: date,
          periodLength: periodLength || profile.periodLength,
          flowIntensity: flowIntensity || profile.flowIntensity,
          periodHistory: periodHistory,
          updatedAt: new Date(),
        },
      });
    } else {
      return await this.prisma.healthProfile.create({
        data: {
          userId,
          lastPeriod: date,
          periodLength: periodLength || 5,
          flowIntensity: flowIntensity || 'Medium',
          periodHistory: [periodData],
        },
      });
    }
  }

  async predictNextPeriod(userId: string): Promise<{
    date: Date;
    confidence: number;
    fertilityWindow?: { start: Date; end: Date };
  } | null> {
    const profile = await this.getHealthProfile(userId);
    if (!profile?.lastPeriod || !profile?.cycleLength) {
      return null;
    }

    // Enhanced prediction using historical data
    let predictedCycleLength = profile.cycleLength;
    let confidence = 0.7; // Base confidence

    if (profile.periodHistory && Array.isArray(profile.periodHistory)) {
      const history = profile.periodHistory as any[];
      if (history.length >= 3) {
        // Calculate average cycle length from history
        const cycleLengths = [];
        for (let i = 1; i < history.length; i++) {
          const currentDate = new Date(history[i].date);
          const previousDate = new Date(history[i - 1].date);
          const daysDiff = Math.round(
            (currentDate.getTime() - previousDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          cycleLengths.push(daysDiff);
        }

        if (cycleLengths.length > 0) {
          const avgCycleLength =
            cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
          predictedCycleLength = Math.round(avgCycleLength);
          confidence = Math.min(0.95, 0.7 + history.length * 0.05); // Higher confidence with more data
        }
      }
    }

    const nextPeriod = new Date(profile.lastPeriod);
    nextPeriod.setDate(nextPeriod.getDate() + predictedCycleLength);

    // Calculate fertility window (ovulation typically occurs 14 days before next period)
    const ovulationDate = new Date(nextPeriod);
    ovulationDate.setDate(ovulationDate.getDate() - 14);

    const fertilityStart = new Date(ovulationDate);
    fertilityStart.setDate(fertilityStart.getDate() - 3); // 3 days before ovulation

    const fertilityEnd = new Date(ovulationDate);
    fertilityEnd.setDate(fertilityEnd.getDate() + 1); // Day after ovulation

    return {
      date: nextPeriod,
      confidence: Math.round(confidence * 100),
      fertilityWindow: {
        start: fertilityStart,
        end: fertilityEnd,
      },
    };
  }

  async updateCycleLength(userId: string, cycleLength: number) {
    const profile = await this.getHealthProfile(userId);
    if (profile) {
      return await this.prisma.healthProfile.update({
        where: { id: profile.id },
        data: {
          cycleLength,
          updatedAt: new Date(),
        },
      });
    } else {
      return await this.prisma.healthProfile.create({
        data: {
          userId,
          cycleLength,
        },
      });
    }
  }

  async updatePeriodLength(userId: string, periodLength: number) {
    const profile = await this.getHealthProfile(userId);
    if (profile) {
      return await this.prisma.healthProfile.update({
        where: { id: profile.id },
        data: {
          periodLength,
          updatedAt: new Date(),
        },
      });
    } else {
      return await this.prisma.healthProfile.create({
        data: {
          userId,
          periodLength,
        },
      });
    }
  }

  async updateFlowIntensity(userId: string, flowIntensity: string) {
    const profile = await this.getHealthProfile(userId);
    if (profile) {
      return await this.prisma.healthProfile.update({
        where: { id: profile.id },
        data: {
          flowIntensity,
          updatedAt: new Date(),
        },
      });
    } else {
      return await this.prisma.healthProfile.create({
        data: {
          userId,
          flowIntensity,
        },
      });
    }
  }

  async updateReminderSettings(userId: string, enabled: boolean, days: number) {
    const profile = await this.getHealthProfile(userId);
    if (profile) {
      return await this.prisma.healthProfile.update({
        where: { id: profile.id },
        data: {
          reminderEnabled: enabled,
          reminderDays: days,
          updatedAt: new Date(),
        },
      });
    } else {
      return await this.prisma.healthProfile.create({
        data: {
          userId,
          reminderEnabled: enabled,
          reminderDays: days,
        },
      });
    }
  }

  async addMedication(userId: string, medication: string) {
    const profile = await this.getHealthProfile(userId);
    if (profile) {
      return await this.prisma.healthProfile.update({
        where: { id: profile.id },
        data: {
          medications: [...new Set([...profile.medications, medication])],
          updatedAt: new Date(),
        },
      });
    }
  }

  async addAllergy(userId: string, allergy: string) {
    const profile = await this.getHealthProfile(userId);
    if (profile) {
      return await this.prisma.healthProfile.update({
        where: { id: profile.id },
        data: {
          allergies: [...new Set([...profile.allergies, allergy])],
          updatedAt: new Date(),
        },
      });
    }
  }
}
