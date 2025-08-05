import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface LocationResult {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
  formattedAddress?: string;
}

@Injectable()
export class LocationService {
  private readonly googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  /**
   * Parse location from various user input formats
   */
  async parseLocationInput(input: string): Promise<LocationResult | null> {
    const lowerInput = input.toLowerCase().trim();

    // Skip location parsing for common non-location phrases
    if (this.isNonLocationPhrase(lowerInput)) {
      return null;
    }

    // Method 1: Check for coordinates (existing functionality)
    const coordinates = this.extractCoordinates(input);
    if (coordinates) {
      return coordinates;
    }

    // Method 2: Check for Nigerian cities/areas
    const nigerianLocation = this.getNigerianLocation(lowerInput);
    if (nigerianLocation) {
      return nigerianLocation;
    }

    // Method 3: Use Google Geocoding API for specific location patterns only
    if (this.looksLikeLocation(lowerInput)) {
      try {
        return await this.geocodeLocation(input);
      } catch (error) {
        console.error('Geocoding failed:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Check if input is a common non-location phrase
   */
  private isNonLocationPhrase(input: string): boolean {
    const nonLocationPhrases = [
      // Greetings
      'hello',
      'hi',
      'hey',
      'good morning',
      'good afternoon',
      'good evening',
      // Health-related but not location
      'i need help',
      'i have symptoms',
      'i feel',
      'pain',
      'discharge',
      'bleeding',
      'clinic',
      'hospital',
      'doctor',
      'help me',
      'i need',
      'thank you',
      'thanks',
      // Questions
      'how',
      'what',
      'when',
      'where',
      'why',
      'can you',
      'do you',
      // General responses
      'yes',
      'no',
      'okay',
      'ok',
      'sure',
      'maybe',
      'probably',
      // Service types
      'gynecology',
      'sti testing',
      'family planning',
      'emergency contraception',
    ];

    return nonLocationPhrases.some((phrase) => input.includes(phrase));
  }

  /**
   * Check if input looks like a location
   */
  private looksLikeLocation(input: string): boolean {
    const locationIndicators = [
      "i'm in",
      'i am in',
      'located in',
      'live in',
      'stay in',
      'near',
      'close to',
      'around',
      'area',
      'street',
      'road',
      'my location is',
      "i'm at",
      'i am at',
    ];

    // Check if it contains location indicators
    if (locationIndicators.some((indicator) => input.includes(indicator))) {
      return true;
    }

    // Check if it's a single word that could be a place name (but not common words)
    const words = input.split(' ');
    if (
      words.length === 1 &&
      words[0].length > 3 &&
      !this.isCommonWord(words[0])
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check if a word is a common English word (not a place name)
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'hello',
      'help',
      'need',
      'want',
      'have',
      'feel',
      'pain',
      'sick',
      'good',
      'bad',
      'yes',
      'no',
      'okay',
      'sure',
      'maybe',
      'very',
      'much',
      'some',
      'any',
      'all',
      'none',
      'more',
      'less',
      'most',
    ];

    return commonWords.includes(word);
  }

  /**
   * Extract coordinates from text (existing functionality)
   */
  private extractCoordinates(input: string): LocationResult | null {
    const coordinateMatch = input.match(/([+-]?\d+\.\d+)[,\s]+([+-]?\d+\.\d+)/);
    if (coordinateMatch) {
      const lat = parseFloat(coordinateMatch[1]);
      const lng = parseFloat(coordinateMatch[2]);
      return { lat, lng };
    }
    return null;
  }

  /**
   * Get coordinates for common Nigerian locations
   */
  private getNigerianLocation(input: string): LocationResult | null {
    const nigerianLocations: { [key: string]: LocationResult } = {
      // Lagos areas
      lagos: {
        lat: 6.5244,
        lng: 3.3792,
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
      },
      ikeja: {
        lat: 6.6018,
        lng: 3.3515,
        city: 'Ikeja',
        state: 'Lagos',
        country: 'Nigeria',
      },
      'victoria island': {
        lat: 6.4281,
        lng: 3.4219,
        city: 'Victoria Island',
        state: 'Lagos',
        country: 'Nigeria',
      },
      lekki: {
        lat: 6.455,
        lng: 3.4731,
        city: 'Lekki',
        state: 'Lagos',
        country: 'Nigeria',
      },
      surulere: {
        lat: 6.5015,
        lng: 3.358,
        city: 'Surulere',
        state: 'Lagos',
        country: 'Nigeria',
      },
      ogudu: {
        lat: 6.6051,
        lng: 3.3958,
        city: 'Ogudu',
        state: 'Lagos',
        country: 'Nigeria',
      },
      ketu: {
        lat: 6.6018,
        lng: 3.3515,
        city: 'Ketu',
        state: 'Lagos',
        country: 'Nigeria',
      },
      maryland: {
        lat: 6.6018,
        lng: 3.3515,
        city: 'Maryland',
        state: 'Lagos',
        country: 'Nigeria',
      },
      alausa: {
        lat: 6.6018,
        lng: 3.3515,
        city: 'Alausa',
        state: 'Lagos',
        country: 'Nigeria',
      },
      omole: {
        lat: 6.6018,
        lng: 3.3515,
        city: 'Omole',
        state: 'Lagos',
        country: 'Nigeria',
      },
      gbagada: {
        lat: 6.5483,
        lng: 3.3897,
        city: 'Gbagada',
        state: 'Lagos',
        country: 'Nigeria',
      },
      yaba: {
        lat: 6.5095,
        lng: 3.3711,
        city: 'Yaba',
        state: 'Lagos',
        country: 'Nigeria',
      },
      oshodi: {
        lat: 6.5483,
        lng: 3.3897,
        city: 'Oshodi',
        state: 'Lagos',
        country: 'Nigeria',
      },
      mushin: {
        lat: 6.5095,
        lng: 3.3711,
        city: 'Mushin',
        state: 'Lagos',
        country: 'Nigeria',
      },
      agege: {
        lat: 6.6157,
        lng: 3.3233,
        city: 'Agege',
        state: 'Lagos',
        country: 'Nigeria',
      },
      isolo: {
        lat: 6.5483,
        lng: 3.3897,
        city: 'Isolo',
        state: 'Lagos',
        country: 'Nigeria',
      },
      ikotun: {
        lat: 6.5483,
        lng: 3.3897,
        city: 'Ikotun',
        state: 'Lagos',
        country: 'Nigeria',
      },
      ejigbo: {
        lat: 6.5483,
        lng: 3.3897,
        city: 'Ejigbo',
        state: 'Lagos',
        country: 'Nigeria',
      },
      ikorodu: {
        lat: 6.6157,
        lng: 3.3233,
        city: 'Ikorodu',
        state: 'Lagos',
        country: 'Nigeria',
      },
      badagry: {
        lat: 6.415,
        lng: 2.8813,
        city: 'Badagry',
        state: 'Lagos',
        country: 'Nigeria',
      },
      epe: {
        lat: 6.5854,
        lng: 3.9836,
        city: 'Epe',
        state: 'Lagos',
        country: 'Nigeria',
      },

      // Abuja areas
      abuja: {
        lat: 9.082,
        lng: 7.3986,
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
      },
      wuse: {
        lat: 9.082,
        lng: 7.3986,
        city: 'Wuse',
        state: 'FCT',
        country: 'Nigeria',
      },
      garki: {
        lat: 9.082,
        lng: 7.3986,
        city: 'Garki',
        state: 'FCT',
        country: 'Nigeria',
      },
      asokoro: {
        lat: 9.082,
        lng: 7.3986,
        city: 'Asokoro',
        state: 'FCT',
        country: 'Nigeria',
      },
      maitama: {
        lat: 9.082,
        lng: 7.3986,
        city: 'Maitama',
        state: 'FCT',
        country: 'Nigeria',
      },
      jabi: {
        lat: 9.082,
        lng: 7.3986,
        city: 'Jabi',
        state: 'FCT',
        country: 'Nigeria',
      },

      // Kano areas
      kano: {
        lat: 11.9914,
        lng: 8.5317,
        city: 'Kano',
        state: 'Kano',
        country: 'Nigeria',
      },
      nasarawa: {
        lat: 11.9914,
        lng: 8.5317,
        city: 'Nasarawa',
        state: 'Kano',
        country: 'Nigeria',
      },
      fagge: {
        lat: 11.9914,
        lng: 8.5317,
        city: 'Fagge',
        state: 'Kano',
        country: 'Nigeria',
      },

      // Other major cities
      ibadan: {
        lat: 7.3961,
        lng: 3.8969,
        city: 'Ibadan',
        state: 'Oyo',
        country: 'Nigeria',
      },
      'port harcourt': {
        lat: 4.8156,
        lng: 7.0498,
        city: 'Port Harcourt',
        state: 'Rivers',
        country: 'Nigeria',
      },
      kaduna: {
        lat: 10.5222,
        lng: 7.4384,
        city: 'Kaduna',
        state: 'Kaduna',
        country: 'Nigeria',
      },
      benin: {
        lat: 6.3176,
        lng: 5.6145,
        city: 'Benin City',
        state: 'Edo',
        country: 'Nigeria',
      },
      maiduguri: {
        lat: 11.8333,
        lng: 13.15,
        city: 'Maiduguri',
        state: 'Borno',
        country: 'Nigeria',
      },
      zaria: {
        lat: 11.1113,
        lng: 7.7227,
        city: 'Zaria',
        state: 'Kaduna',
        country: 'Nigeria',
      },
      bauchi: {
        lat: 10.3103,
        lng: 9.8439,
        city: 'Bauchi',
        state: 'Bauchi',
        country: 'Nigeria',
      },
      akure: {
        lat: 7.2526,
        lng: 5.1931,
        city: 'Akure',
        state: 'Ondo',
        country: 'Nigeria',
      },
      calabar: {
        lat: 4.9757,
        lng: 8.3417,
        city: 'Calabar',
        state: 'Cross River',
        country: 'Nigeria',
      },
      jos: {
        lat: 9.8965,
        lng: 8.8583,
        city: 'Jos',
        state: 'Plateau',
        country: 'Nigeria',
      },
      enugu: {
        lat: 6.4584,
        lng: 7.5464,
        city: 'Enugu',
        state: 'Enugu',
        country: 'Nigeria',
      },
      sokoto: {
        lat: 13.0533,
        lng: 5.2333,
        city: 'Sokoto',
        state: 'Sokoto',
        country: 'Nigeria',
      },
      oyo: {
        lat: 7.8526,
        lng: 3.9312,
        city: 'Oyo',
        state: 'Oyo',
        country: 'Nigeria',
      },
      abeokuta: {
        lat: 7.1557,
        lng: 3.3451,
        city: 'Abeokuta',
        state: 'Ogun',
        country: 'Nigeria',
      },
      warri: {
        lat: 5.556,
        lng: 5.7936,
        city: 'Warri',
        state: 'Delta',
        country: 'Nigeria',
      },
      onitsha: {
        lat: 6.1375,
        lng: 6.7797,
        city: 'Onitsha',
        state: 'Anambra',
        country: 'Nigeria',
      },
      owerri: {
        lat: 5.4833,
        lng: 7.0333,
        city: 'Owerri',
        state: 'Imo',
        country: 'Nigeria',
      },
      uyo: {
        lat: 5.0513,
        lng: 7.9335,
        city: 'Uyo',
        state: 'Akwa Ibom',
        country: 'Nigeria',
      },
      asaba: {
        lat: 6.1833,
        lng: 6.75,
        city: 'Asaba',
        state: 'Delta',
        country: 'Nigeria',
      },
      awka: {
        lat: 6.2109,
        lng: 7.0744,
        city: 'Awka',
        state: 'Anambra',
        country: 'Nigeria',
      },
      osogbo: {
        lat: 7.7669,
        lng: 4.5601,
        city: 'Osogbo',
        state: 'Osun',
        country: 'Nigeria',
      },
      ilorin: {
        lat: 8.5,
        lng: 4.55,
        city: 'Ilorin',
        state: 'Kwara',
        country: 'Nigeria',
      },
      jalingo: {
        lat: 8.9,
        lng: 11.3667,
        city: 'Jalingo',
        state: 'Taraba',
        country: 'Nigeria',
      },
      damaturu: {
        lat: 11.7483,
        lng: 11.9669,
        city: 'Damaturu',
        state: 'Yobe',
        country: 'Nigeria',
      },
      gombe: {
        lat: 10.2897,
        lng: 11.1673,
        city: 'Gombe',
        state: 'Gombe',
        country: 'Nigeria',
      },
      lafia: {
        lat: 8.4833,
        lng: 8.5167,
        city: 'Lafia',
        state: 'Nasarawa',
        country: 'Nigeria',
      },
      minna: {
        lat: 9.6139,
        lng: 6.5569,
        city: 'Minna',
        state: 'Niger',
        country: 'Nigeria',
      },
      lokoja: {
        lat: 7.8023,
        lng: 6.733,
        city: 'Lokoja',
        state: 'Kogi',
        country: 'Nigeria',
      },
      makurdi: {
        lat: 7.7333,
        lng: 8.5333,
        city: 'Makurdi',
        state: 'Benue',
        country: 'Nigeria',
      },
      adama: {
        lat: 9.0833,
        lng: 7.5333,
        city: 'Adama',
        state: 'Niger',
        country: 'Nigeria',
      },
      yola: {
        lat: 9.2,
        lng: 12.4833,
        city: 'Yola',
        state: 'Adamawa',
        country: 'Nigeria',
      },
      'birnin kebbi': {
        lat: 12.4539,
        lng: 4.1975,
        city: 'Birnin Kebbi',
        state: 'Kebbi',
        country: 'Nigeria',
      },
      katsina: {
        lat: 12.9908,
        lng: 7.6018,
        city: 'Katsina',
        state: 'Katsina',
        country: 'Nigeria',
      },
      dutse: {
        lat: 11.8283,
        lng: 9.3158,
        city: 'Dutse',
        state: 'Jigawa',
        country: 'Nigeria',
      },
      gusau: {
        lat: 12.17,
        lng: 6.6644,
        city: 'Gusau',
        state: 'Zamfara',
        country: 'Nigeria',
      },
      kebbi: {
        lat: 12.4539,
        lng: 4.1975,
        city: 'Kebbi',
        state: 'Kebbi',
        country: 'Nigeria',
      },
      jigawa: {
        lat: 11.8283,
        lng: 9.3158,
        city: 'Jigawa',
        state: 'Jigawa',
        country: 'Nigeria',
      },
      zamfara: {
        lat: 12.17,
        lng: 6.6644,
        city: 'Zamfara',
        state: 'Zamfara',
        country: 'Nigeria',
      },
    };

    // Check for exact matches
    if (nigerianLocations[input]) {
      return nigerianLocations[input];
    }

    // Check for partial matches
    for (const [key, location] of Object.entries(nigerianLocations)) {
      if (input.includes(key) || key.includes(input)) {
        return location;
      }
    }

    return null;
  }

  /**
   * Use Google Geocoding API to convert any location text to coordinates
   */
  private async geocodeLocation(
    locationText: string,
  ): Promise<LocationResult | null> {
    if (!this.googleMapsApiKey) {
      throw new Error('Google Maps API key not set');
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationText + ', Nigeria')}&key=${this.googleMapsApiKey}`;
      const response = await axios.get(url);

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        return {
          lat: location.lat,
          lng: location.lng,
          formattedAddress: result.formatted_address,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Get user-friendly location instructions
   */
  getLocationInstructions(): string {
    return `📍 To help you find clinics, please share your location in any of these ways:

1️⃣ **City/Area name**: "I'm in Ogudu" or "Lagos"
2️⃣ **Coordinates**: "6.6051, 3.3958" 
3️⃣ **Address**: "Near Ikeja Mall" or "Victoria Island"

Just type your location and I'll find clinics near you! 🏥`;
  }

  /**
   * Format location for display
   */
  formatLocation(location: LocationResult): string {
    if (location.city) {
      const stateOrCountry = location.state || location.country || '';
      return stateOrCountry
        ? `${location.city}, ${stateOrCountry}`
        : location.city;
    }
    if (location.formattedAddress) {
      return location.formattedAddress;
    }
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  }
}
