import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateUser(phoneNumber: string) {
    let user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phoneNumber,
          language: 'en', // Default to English
          // Add location fields if not present in schema
          // locationLat: null,
          // locationLng: null,
          // city: null,
        },
      });
    }

    return user;
  }

  async updateUserProfile(userId: string, data: any) {
    return await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updateUserLocation(
    userId: string,
    lat: number,
    lng: number,
    city?: string,
  ) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        locationLat: lat,
        locationLng: lng,
        city: city || undefined,
      },
    });
  }

  async getUserLocation(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return {
      lat: user.locationLat,
      lng: user.locationLng,
      city: user.city,
    };
  }
}
