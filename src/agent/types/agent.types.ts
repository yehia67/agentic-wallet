// Agent types
export type AgentType = 'planning' | 'research' | 'judge' | 'wallet';

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

// Wallet Agent types
export interface WalletTransaction {
  to: string;
  value?: string;
  data?: string;
}

export interface WalletAction {
  type:
    | 'check_balance'
    | 'send_transaction'
    | 'approve_token'
    | 'batch_transactions';
  parameters?: {
    to?: string;
    data?: string;
    spender?: string;
    transactions?: WalletTransaction[];
  };
}

export interface WalletResult {
  success: boolean;
  message: string;
  address?: string;
  balance?: number;
  transactionHash?: string;
  explorerUrl?: string;
  error?: string;
}

// Coordinator types
export interface AgentContext {
  userIntent: string;
  userPreferences?: Record<string, any>;
  planningResult?: PlanningResponse;
  researchResult?: ResearchResponse;
  judgeResult?: JudgeResponse;
  walletAction?: WalletAction;
  walletResult?: WalletResult;
  cycleCount: number;
}
