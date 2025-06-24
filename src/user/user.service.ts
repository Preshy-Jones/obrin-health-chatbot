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
}
