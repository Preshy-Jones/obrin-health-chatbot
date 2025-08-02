import { Injectable } from '@nestjs/common';

interface SymptomAssessment {
  possibleConditions: string[];
  urgency: 'low' | 'medium' | 'high';
  recommendations: string[];
  referralNeeded: boolean;
  testingRecommended: string[];
}

@Injectable()
export class SymptomCheckerService {
  constructor() {}

  async assessSTISymptoms(
    symptoms: string[],
    userId: string,
  ): Promise<SymptomAssessment> {
    const assessment: SymptomAssessment = {
      possibleConditions: this.getPossibleSTIConditions(symptoms),
      urgency: this.determineUrgency(symptoms),
      recommendations: this.getSTIRecommendations(),
      referralNeeded: this.needsReferral(symptoms),
      testingRecommended: this.getRecommendedTests(symptoms),
    };

    return assessment;
  }

  async assessGeneralSymptoms(
    symptoms: string[],
    userId: string,
  ): Promise<SymptomAssessment> {
    const assessment: SymptomAssessment = {
      possibleConditions: this.getPossibleGeneralConditions(symptoms),
      urgency: this.determineUrgency(symptoms),
      recommendations: this.getGeneralRecommendations(),
      referralNeeded: this.needsReferral(symptoms),
      testingRecommended: [],
    };

    return assessment;
  }

  async generateSymptomResponse(
    assessment: SymptomAssessment,
    userLocation?: any,
  ): Promise<string> {
    let response = '';

    // Add urgency indicator
    if (assessment.urgency === 'high') {
      response += `⚠️ These symptoms may need prompt medical attention.\n\n`;
    } else if (assessment.urgency === 'medium') {
      response += `📋 These symptoms should be evaluated by a healthcare provider.\n\n`;
    }

    // Add possible conditions
    if (assessment.possibleConditions.length > 0) {
      response += `Possible causes:\n`;
      assessment.possibleConditions.forEach((condition, index) => {
        response += `${index + 1}. ${condition}\n`;
      });
      response += '\n';
    }

    // Add recommendations
    if (assessment.recommendations.length > 0) {
      response += `💡 Recommendations:\n`;
      assessment.recommendations.forEach((rec, index) => {
        response += `${index + 1}. ${rec}\n`;
      });
      response += '\n';
    }

    // Add testing recommendations
    if (assessment.testingRecommended.length > 0) {
      response += `🔬 Recommended testing:\n`;
      assessment.testingRecommended.forEach((test, index) => {
        response += `${index + 1}. ${test}\n`;
      });
      response += '\n';
    }

    // Add clinic referral if needed
    if (assessment.referralNeeded && userLocation) {
      response += `🏥 Would you like me to help you find nearby clinics for testing or consultation?`;
    } else if (assessment.referralNeeded) {
      response += `🏥 Please share your location so I can help you find nearby clinics.`;
    }

    return response;
  }

  private getPossibleSTIConditions(symptoms: string[]): string[] {
    const conditions = [];
    const lowerSymptoms = symptoms.map((s) => s.toLowerCase());

    if (lowerSymptoms.some((s) => s.includes('discharge'))) {
      conditions.push('Chlamydia or Gonorrhea');
    }
    if (lowerSymptoms.some((s) => s.includes('burning'))) {
      conditions.push('Urinary Tract Infection (UTI)');
    }
    if (lowerSymptoms.some((s) => s.includes('itching'))) {
      conditions.push('Yeast Infection or Bacterial Vaginosis');
    }
    if (lowerSymptoms.some((s) => s.includes('pain'))) {
      conditions.push('Pelvic Inflammatory Disease (PID)');
    }

    return conditions.length > 0
      ? conditions
      : ['Sexual health concern requiring evaluation'];
  }

  private getPossibleGeneralConditions(symptoms: string[]): string[] {
    const conditions = [];
    const lowerSymptoms = symptoms.map((s) => s.toLowerCase());

    if (lowerSymptoms.some((s) => s.includes('cramp'))) {
      conditions.push('Menstrual cramps or dysmenorrhea');
    }
    if (lowerSymptoms.some((s) => s.includes('irregular'))) {
      conditions.push('Irregular menstrual cycle');
    }
    if (lowerSymptoms.some((s) => s.includes('heavy'))) {
      conditions.push('Heavy menstrual bleeding');
    }

    return conditions.length > 0
      ? conditions
      : ['General health concern requiring evaluation'];
  }

  private determineUrgency(symptoms: string[]): 'low' | 'medium' | 'high' {
    const highUrgencySymptoms = [
      'severe pain',
      'fever',
      'heavy bleeding',
      'swelling',
    ];
    const mediumUrgencySymptoms = ['burning', 'discharge', 'itching', 'pain'];

    const hasHighUrgency = highUrgencySymptoms.some((symptom) =>
      symptoms.some((s) => s.toLowerCase().includes(symptom)),
    );

    const hasMediumUrgency = mediumUrgencySymptoms.some((symptom) =>
      symptoms.some((s) => s.toLowerCase().includes(symptom)),
    );

    if (hasHighUrgency) return 'high';
    if (hasMediumUrgency) return 'medium';
    return 'low';
  }

  private getSTIRecommendations(): string[] {
    return [
      'Consult a healthcare provider for proper evaluation',
      'Practice good hygiene',
      'Avoid sexual activity until evaluated',
      'Monitor symptoms for changes',
      'Remember: STIs are treatable and nothing to be ashamed of',
    ];
  }

  private getGeneralRecommendations(): string[] {
    return [
      'Consult a healthcare provider for proper evaluation',
      'Practice good hygiene',
      'Monitor symptoms for changes',
      'Keep track of your symptoms',
    ];
  }

  private needsReferral(symptoms: string[]): boolean {
    const referralSymptoms = [
      'pain',
      'discharge',
      'burning',
      'itching',
      'bleeding',
    ];
    return referralSymptoms.some((symptom) =>
      symptoms.some((s) => s.toLowerCase().includes(symptom)),
    );
  }

  private getRecommendedTests(symptoms: string[]): string[] {
    const tests = [];

    if (symptoms.some((s) => s.toLowerCase().includes('discharge'))) {
      tests.push('STI testing (chlamydia, gonorrhea)');
    }

    if (symptoms.some((s) => s.toLowerCase().includes('burning'))) {
      tests.push('Urine test for UTI');
    }

    if (symptoms.some((s) => s.toLowerCase().includes('itching'))) {
      tests.push('Vaginal swab for yeast infection');
    }

    return tests;
  }
}
