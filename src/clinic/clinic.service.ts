import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

interface Clinic {
  name: string;
  address: string;
  phone?: string;
  services: string[];
  rating?: number;
  distance?: string;
}

@Injectable()
export class ClinicService {
  constructor(private prisma: PrismaService) {}

  async searchNearbyclinics(
    location: string,
    serviceType?: string,
  ): Promise<Clinic[]> {
    try {
      // In a real implementation, you would integrate with Google Places API, Bing Maps, or similar
      // For now, we'll return mock data based on common Nigerian locations
      const mockClinics = this.getMockClinics(location);

      // Save search history
      // await this.saveSearchHistory(userId, location, serviceType, mockClinics);

      return mockClinics;
    } catch (error) {
      console.error('Error searching for clinics:', error);
      return [];
    }
  }

  private getMockClinics(location: string): Clinic[] {
    const nigerianClinics: { [key: string]: Clinic[] } = {
      lagos: [
        {
          name: 'Lagos State University Teaching Hospital',
          address: 'Ikeja, Lagos State',
          phone: '+234-1-4960981',
          services: [
            'General Medicine',
            'Gynecology',
            'Family Planning',
            'STI Testing',
          ],
          rating: 4.2,
          distance: '2.5km',
        },
        {
          name: 'Reddington Hospital',
          address: 'Victoria Island, Lagos',
          phone: '+234-1-4621234',
          services: [
            "Women's Health",
            'Reproductive Health',
            'Contraception Counseling',
          ],
          rating: 4.5,
          distance: '3.1km',
        },
        {
          name: 'Planned Parenthood Federation of Nigeria',
          address: 'Surulere, Lagos',
          phone: '+234-1-8123456',
          services: [
            'Family Planning',
            'STI Testing',
            'Youth-Friendly Services',
          ],
          rating: 4.3,
          distance: '4.2km',
        },
      ],
      abuja: [
        {
          name: 'National Hospital Abuja',
          address: 'Central Area, Abuja',
          phone: '+234-9-4613000',
          services: ['General Medicine', 'Gynecology', 'Adolescent Health'],
          rating: 4.1,
          distance: '1.8km',
        },
        {
          name: 'Garki Hospital',
          address: 'Garki, Abuja',
          phone: '+234-9-2345678',
          services: [
            'Reproductive Health',
            'Family Planning',
            'STI Counseling',
          ],
          rating: 3.9,
          distance: '2.3km',
        },
      ],
      kano: [
        {
          name: 'Aminu Kano Teaching Hospital',
          address: 'Kano, Kano State',
          phone: '+234-64-664423',
          services: ["Women's Health", 'Family Planning', 'Youth Services'],
          rating: 4.0,
          distance: '1.5km',
        },
      ],
      default: [
        {
          name: 'Community Health Center',
          address: 'City Center',
          services: [
            'Basic Health Services',
            'Family Planning',
            'Health Education',
          ],
          rating: 3.8,
          distance: '2.0km',
        },
        {
          name: 'Regional Medical Center',
          address: 'Medical District',
          phone: 'Contact locally',
          services: ['Comprehensive Health Services', 'Reproductive Health'],
          rating: 4.0,
          distance: '3.5km',
        },
      ],
    };

    const locationKey = location.toLowerCase();
    return nigerianClinics[locationKey] || nigerianClinics['default'];
  }

  async saveSearchHistory(
    userId: string,
    location: string,
    serviceType: string,
    results: Clinic[],
  ) {
    try {
      await this.prisma.clinicSearch.create({
        data: {
          userId,
          location,
          serviceType: serviceType || 'general',
          results: results as any,
        },
      });
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  async getSearchHistory(userId: string) {
    return await this.prisma.clinicSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
