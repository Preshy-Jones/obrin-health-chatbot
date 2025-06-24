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
}
