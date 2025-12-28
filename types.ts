
export enum BurnDepth {
  I = 'I',
  IIa = 'IIa (SDB)',
  IIb = 'IIb (DDB)',
  III = 'III (DB)'
}

export interface BodyPartBurn {
  partName: string;
  percentage: number; 
  depth: BurnDepth;
}

export interface PatientData {
  age: number;
  weight: number;
  sex: 'male' | 'female';
  burns: BodyPartBurn[];
  inhalationInjury: boolean;
  comorbidities: string;
}

export interface BurnAssessmentResult {
  totalTbsa: number;
  burnIndex: number;
  prognosticIndex: number;
  fluidResuscitation: {
    first24hTotal: number;
    first8h: number;
    next16h: number;
  };
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  transferRecommended: boolean;
}
