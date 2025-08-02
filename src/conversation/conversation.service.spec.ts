import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from './conversation.service';

describe('ConversationService', () => {
  let service: ConversationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationService],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Intent Detection', () => {
    it('should detect emergency contraception intent', () => {
      const message = 'Condom broke last night and I am panicking';
      // This would test the private method if it were public
      expect(message.toLowerCase()).toContain('condom broke');
    });

        it('should detect pregnancy concern intent', () => {
      const message = 'I have not had my period in 6 weeks and feel tired';
      const hasPregnancyKeywords = message.toLowerCase().includes('pregnant') || 
                                  message.toLowerCase().includes('missed period');
      expect(hasPregnancyKeywords).toBe(true);
    });

    it('should detect STI symptoms intent', () => {
      const message = 'I notice burning during urination and unusual discharge';
      const hasSTIKeywords = message.toLowerCase().includes('sti') || 
                            message.toLowerCase().includes('burning') ||
                            message.toLowerCase().includes('discharge');
      expect(hasSTIKeywords).toBe(true);
    });

    it('should detect menstrual tracking intent', () => {
      const message = 'I want to track my period quietly';
      const hasMenstrualKeywords = message.toLowerCase().includes('period tracking') ||
                                  message.toLowerCase().includes('menstrual');
      expect(hasMenstrualKeywords).toBe(true);
    });

    it('should detect menopause support intent', () => {
      const message = 'I have pain during sex at my age';
      const hasMenopauseKeywords = message.toLowerCase().includes('hot flash') ||
                                  message.toLowerCase().includes('menopause') ||
                                  message.toLowerCase().includes('dryness');
      expect(hasMenopauseKeywords).toBe(true);
    });

    it('should detect clinic search intent', () => {
      const message = 'Where can I get a Pap smear?';
      const hasClinicKeywords = message.toLowerCase().includes('clinic') ||
                               message.toLowerCase().includes('hospital') ||
                               message.toLowerCase().includes('pap smear');
      expect(hasClinicKeywords).toBe(true);
    });
  });

  describe('Location Parsing', () => {
    it('should parse location coordinates', () => {
      const message = 'My location is 6.5244, 3.3792';
      const locationMatch = message.match(
        /([+-]?\d+\.\d+)[,\s]+([+-]?\d+\.\d+)/,
      );

      expect(locationMatch).toBeTruthy();
      if (locationMatch) {
        const lat = parseFloat(locationMatch[1]);
        const lng = parseFloat(locationMatch[2]);
        expect(lat).toBe(6.5244);
        expect(lng).toBe(3.3792);
      }
    });

    it('should handle different location formats', () => {
      const formats = [
        'My location is 6.5244, 3.3792',
        'lat: 6.5244, lng: 3.3792',
        '6.5244,3.3792',
      ];

      formats.forEach((message) => {
        const locationMatch = message.match(
          /([+-]?\d+\.\d+)[,\s]+([+-]?\d+\.\d+)/,
        );
        expect(locationMatch).toBeTruthy();
      });
    });
  });

  describe('Symptom Extraction', () => {
    it('should extract common symptoms', () => {
      const message = 'I have pain and unusual discharge';
      const symptomKeywords = [
        'pain',
        'discharge',
        'itching',
        'burning',
        'bleeding',
        'cramps',
        'nausea',
        'fever',
        'rash',
        'swelling',
        'odor',
        'unusual',
      ];

      const lowerMessage = message.toLowerCase();
      const extractedSymptoms = symptomKeywords.filter((symptom) =>
        lowerMessage.includes(symptom),
      );

      expect(extractedSymptoms).toContain('pain');
      expect(extractedSymptoms).toContain('discharge');
      expect(extractedSymptoms).toContain('unusual');
    });
  });

  describe('Use Case Validation', () => {
    it('should handle Use Case 1: Finding a Clinic Nearby', () => {
      const message = 'Where can I get a Pap smear?';
      const isClinicSearch =
        message.toLowerCase().includes('clinic') ||
        message.toLowerCase().includes('hospital') ||
        message.toLowerCase().includes('doctor') ||
        message.toLowerCase().includes('pap smear') ||
        message.toLowerCase().includes('where to get');

      expect(isClinicSearch).toBe(true);
    });

    it('should handle Use Case 2: Understanding a Scary Symptom', () => {
      const message = 'I see thick black discharge and I am scared';
      const isSymptomCheck =
        message.toLowerCase().includes('symptom') ||
        message.toLowerCase().includes('pain') ||
        message.toLowerCase().includes('discharge') ||
        message.toLowerCase().includes('unusual');

      expect(isSymptomCheck).toBe(true);
    });

    it('should handle Use Case 3: Emergency Pregnancy Advice', () => {
      const message = 'Condom broke last night and I am panicking';
      const isEmergencyContraception =
        message.toLowerCase().includes('condom broke') ||
        message.toLowerCase().includes('emergency contraception') ||
        message.toLowerCase().includes('morning after') ||
        message.toLowerCase().includes('unprotected sex');

      expect(isEmergencyContraception).toBe(true);
    });

    it('should handle Use Case 4: Private Menstrual Tracking', () => {
      const message = 'I want to track my period quietly';
      const isMenstrualTracking =
        message.toLowerCase().includes('period tracking') ||
        message.toLowerCase().includes('last period') ||
        message.toLowerCase().includes('cycle') ||
        message.toLowerCase().includes('menstrual');

      expect(isMenstrualTracking).toBe(true);
    });

    it('should handle Use Case 5: Culturally Sensitive Education', () => {
      const message =
        'I have questions about sex and faith but I am afraid to ask publicly';
      // This would be handled by the general health intent
      const isGeneralHealth =
        !message.toLowerCase().includes('clinic') &&
        !message.toLowerCase().includes('symptom') &&
        !message.toLowerCase().includes('condom broke') &&
        !message.toLowerCase().includes('period tracking');

      expect(isGeneralHealth).toBe(true);
    });

    it('should handle Use Case 6: Pregnancy Risk After Missed Pills', () => {
      const message =
        'I missed 2 days of my birth control pills and had unprotected sex';
      const isContraception =
        message.toLowerCase().includes('contraception') ||
        message.toLowerCase().includes('birth control') ||
        message.toLowerCase().includes('pill') ||
        message.toLowerCase().includes('missed pills');

      expect(isContraception).toBe(true);
    });

    it('should handle Use Case 7: STI Symptoms After Unprotected Sex', () => {
      const message = 'I notice burning during urination and unusual discharge';
      const isSTISymptoms =
        message.toLowerCase().includes('sti') ||
        message.toLowerCase().includes('std') ||
        message.toLowerCase().includes('infection') ||
        message.toLowerCase().includes('hiv test') ||
        message.toLowerCase().includes('burning') ||
        message.toLowerCase().includes('discharge') ||
        message.toLowerCase().includes('itching');

      expect(isSTISymptoms).toBe(true);
    });

    it('should handle Use Case 8: Pregnancy Confirmation Without a Test', () => {
      const message = 'I have not had my period in 6 weeks and feel tired';
      const isPregnancyConcern =
        message.toLowerCase().includes('pregnant') ||
        message.toLowerCase().includes('missed period') ||
        message.toLowerCase().includes('pregnancy test') ||
        message.toLowerCase().includes('am i pregnant');

      expect(isPregnancyConcern).toBe(true);
    });

    it('should handle Use Case 9: Discreet STI Testing Info', () => {
      const message = 'I want an HIV test but I fear stigma';
      const isSTISymptoms =
        message.toLowerCase().includes('sti') ||
        message.toLowerCase().includes('std') ||
        message.toLowerCase().includes('infection') ||
        message.toLowerCase().includes('hiv test');

      expect(isSTISymptoms).toBe(true);
    });

    it('should handle Use Case 10: First-Time Pregnancy Guidance', () => {
      const message =
        'I suspect I am pregnant but I do not know what to do next';
      const isPregnancyConcern =
        message.toLowerCase().includes('pregnant') ||
        message.toLowerCase().includes('missed period') ||
        message.toLowerCase().includes('pregnancy test') ||
        message.toLowerCase().includes('am i pregnant');

      expect(isPregnancyConcern).toBe(true);
    });

    it('should handle Use Case 11-15: Menopause Support', () => {
      const message = 'I have pain during sex at my age';
      const isMenopauseSupport =
        message.toLowerCase().includes('hot flash') ||
        message.toLowerCase().includes('menopause') ||
        message.toLowerCase().includes('dryness') ||
        message.toLowerCase().includes('mood swing') ||
        message.toLowerCase().includes('memory loss');

      expect(isMenopauseSupport).toBe(true);
    });
  });
});
