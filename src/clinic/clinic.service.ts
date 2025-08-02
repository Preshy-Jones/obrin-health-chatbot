import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import axios from 'axios';

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

  /**
   * Search for nearby clinics using Google Maps Places API.
   * @param lat Latitude
   * @param lng Longitude
   * @param radius Search radius in meters (default 5000)
   * @param keyword Optional keyword (e.g., 'Pap smear', 'STI', etc.)
   */
  async searchNearbyClinicsGoogleMaps(
    lat: number,
    lng: number,
    radius = 5000,
    keyword?: string,
  ): Promise<Clinic[]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not set');
    }
    const type = 'hospital'; // or 'clinic', but 'hospital' is more widely supported
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;
    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }
    const response = await axios.get(url);
    const results = response.data.results || [];
    return results.map((place: any) => ({
      name: place.name,
      address: place.vicinity,
      phone: undefined, // Google Places Nearby Search does not return phone, only Place Details does
      services: [],
      rating: place.rating,
      distance: undefined, // Can be calculated on frontend if needed
    }));
  }

  /**
   * Search for specific SRH services
   * @param lat Latitude
   * @param lng Longitude
   * @param serviceType Type of service (e.g., 'pap_smear', 'sti_testing', 'contraception')
   */
  async searchSRHServices(
    lat: number,
    lng: number,
    serviceType: string,
  ): Promise<Clinic[]> {
    const keywords = this.getServiceKeywords(serviceType);
    const clinics: Clinic[] = [];

    for (const keyword of keywords) {
      try {
        const results = await this.searchNearbyClinicsGoogleMaps(
          lat,
          lng,
          10000,
          keyword,
        );
        clinics.push(...results);
      } catch (error) {
        console.error(`Error searching for ${keyword}:`, error);
      }
    }

    // Remove duplicates and return top results
    const uniqueClinics = this.removeDuplicateClinics(clinics);
    return uniqueClinics.slice(0, 5);
  }

  private getServiceKeywords(serviceType: string): string[] {
    const serviceKeywords: { [key: string]: string[] } = {
      pap_smear: [
        'pap smear',
        'cervical screening',
        'gynecology',
        'women health',
      ],
      sti_testing: [
        'STI testing',
        'STD testing',
        'sexual health',
        'infectious disease',
      ],
      contraception: [
        'family planning',
        'contraception',
        'birth control',
        'reproductive health',
      ],
      emergency_contraception: [
        'emergency contraception',
        'plan B',
        'morning after pill',
      ],
      pregnancy_test: ['pregnancy test', 'prenatal care', 'maternity'],
      menopause: ['menopause', 'gynecology', 'women health', 'hormone therapy'],
    };

    return serviceKeywords[serviceType] || ['healthcare', 'medical'];
  }

  private removeDuplicateClinics(clinics: Clinic[]): Clinic[] {
    const seen = new Set();
    return clinics.filter((clinic) => {
      const key = clinic.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Fallback: Search for clinics by city/location name (mock data)
   */
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
