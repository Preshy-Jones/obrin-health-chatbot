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

  async updateLastPeriod(userId: string, date: Date) {
    const profile = await this.getHealthProfile(userId);
    if (profile) {
      return await this.prisma.healthProfile.update({
        where: { id: profile.id },
        data: {
          lastPeriod: date,
          updatedAt: new Date(),
        },
      });
    } else {
      return await this.prisma.healthProfile.create({
        data: {
          userId,
          lastPeriod: date,
        },
      });
    }
  }

  async predictNextPeriod(userId: string): Promise<Date | null> {
    const profile = await this.getHealthProfile(userId);
    if (!profile?.lastPeriod || !profile?.cycleLength) {
      return null;
    }

    const nextPeriod = new Date(profile.lastPeriod);
    nextPeriod.setDate(nextPeriod.getDate() + profile.cycleLength);
    return nextPeriod;
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
