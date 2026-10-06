export interface Contact {
  id: number;
  name: string;
  email: string;
  segment: string | null;
}

export interface ContactInput {
  name: string;
  email: string;
  segment: string | null;
}

export interface ContactPage {
  items: Contact[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ContactResponse {
  id: number;
  surveyId: number;
  surveyName: string;
  surveyType: 'NPS' | 'CSAT';
  score: number;
  comment: string | null;
  channel: string;
  respondedAt: string;
}

export interface NpsClass {
  count: number;
  pct: number;
}

export interface AnalyticsSummary {
  npsScore: number;
  npsResponses: number;
  promoters: NpsClass;
  neutrals: NpsClass;
  detractors: NpsClass;
  responsesCount: number;
  csatAvg: number | null;
}

export interface ContactSatisfaction {
  responsesCount: number;
  promoters: number;
  neutrals: number;
  detractors: number;
  latestNpsClass: 'Promotor' | 'Neutro' | 'Detrator' | null;
}
