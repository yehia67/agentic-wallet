// Agent types
export type AgentType = 'planning' | 'research' | 'judge';

// Research Agent types
export interface ResearchFinding {
  topic: string;
  summary: string;
  relevance_score: number;
  sources: string[];
}

export interface ResearchResponse {
  findings: ResearchFinding[];
  overall_assessment: string;
}

// Planning Agent types
export interface PlanStep {
  step_number: number;
  title: string;
  type: string;
  description: string;
  expected_outcome: string;
}

export interface PlanningResponse {
  goal: string;
  constraints: string[];
  steps: PlanStep[];
  estimated_timeline: string;
  success_metrics: string[];
}

// Judge Agent types
export interface RiskAssessment {
  financial_risk: 'low' | 'medium' | 'high';
  technical_risk: 'low' | 'medium' | 'high';
  compliance_risk: 'low' | 'medium' | 'high';
}

export interface JudgeResponse {
  decision: 'approved' | 'rejected' | 'needs_revision';
  reasoning: string;
  risk_assessment: RiskAssessment;
  improvement_suggestions: string[];
}

// Coordinator types
export interface AgentContext {
  userIntent: string;
  userPreferences?: Record<string, any>;
  planningResult?: PlanningResponse;
  researchResult?: ResearchResponse;
  judgeResult?: JudgeResponse;
  cycleCount: number;
}
