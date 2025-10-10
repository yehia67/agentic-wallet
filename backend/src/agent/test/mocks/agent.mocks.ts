import { AgentMessageDto, AgentResponseDto } from '../../dto/agent-message.dto';
import {
  AgentContext,
  PlanningResponse,
  ResearchResponse,
  JudgeResponse,
} from '../../types/agent.types';

export const mockAgentMessageDto: AgentMessageDto = {
  message:
    'I want to participate in the latest Arbitrum airdrop. What steps should I take?',
  preferences: {
    risk_tolerance: 'medium',
    investment_amount: '$500',
    time_horizon: 'short-term',
  },
};

export const mockPlanningResponse: PlanningResponse = {
  goal: 'Participate in the latest Arbitrum airdrop',
  constraints: [
    'Medium risk tolerance',
    'Investment amount of $500',
    'Short-term time horizon',
  ],
  steps: [
    {
      step_number: 1,
      title: 'Research Airdrop Requirements',
      type: 'research',
      description:
        'Look up the requirements and eligibility criteria for the latest Arbitrum airdrop.',
      expected_outcome:
        'You will have a clear understanding of what is needed to qualify for the airdrop.',
    },
    {
      step_number: 2,
      title: 'Set Up a Compatible Wallet',
      type: 'execution',
      description:
        'Create or ensure you have a cryptocurrency wallet that supports Arbitrum and airdrop participation.',
      expected_outcome:
        'You will be ready to receive the airdrop in a compatible wallet.',
    },
  ],
  estimated_timeline:
    '2-4 weeks for successful participation and airdrop claim',
  success_metrics: [
    'Successfully completed all airdrop participation steps',
    'Received airdrop tokens in your wallet',
    'Maintained investment within $500',
  ],
};

export const mockResearchResponse: ResearchResponse = {
  findings: [
    {
      topic: 'Arbitrum Airdrop Requirements and Eligibility (2025)',
      summary:
        'The latest Arbitrum airdrop targets active users on specific Arbitrum DeFi protocols.',
      relevance_score: 9.5,
      sources: ['3'],
    },
    {
      topic: 'Technical Steps to Participate',
      summary:
        'Participants must set up a compatible crypto wallet supporting the Arbitrum network.',
      relevance_score: 9,
      sources: ['3'],
    },
  ],
  overall_assessment:
    'Participating in the latest Arbitrum airdrop requires active engagement with specific DeFi protocols.',
};

export const mockJudgeResponse: JudgeResponse = {
  decision: 'approved',
  reasoning:
    "The plan adheres well to the user's medium risk tolerance, budget constraints, and short-term time horizon.",
  risk_assessment: {
    financial_risk: 'medium',
    technical_risk: 'medium',
    compliance_risk: 'low',
  },
  improvement_suggestions: [],
};

export const mockAgentContext: AgentContext = {
  userIntent: mockAgentMessageDto.message,
  userPreferences: mockAgentMessageDto.preferences,
  planningResult: mockPlanningResponse,
  researchResult: mockResearchResponse,
  judgeResult: mockJudgeResponse,
  cycleCount: 1,
};

export const mockAgentResponseDto: AgentResponseDto = {
  message: 'Plan approved! Here are the details:',
  plan: mockPlanningResponse,
  research: mockResearchResponse,
  decision: mockJudgeResponse,
  status: 'completed',
};

export const mockOpenAIResponse = `{
  "goal": "Participate in the latest Arbitrum airdrop",
  "constraints": [
    "Medium risk tolerance",
    "Investment amount of $500",
    "Short-term time horizon"
  ],
  "steps": [
    {
      "step_number": 1,
      "title": "Research Airdrop Requirements",
      "type": "research",
      "description": "Look up the requirements and eligibility criteria for the latest Arbitrum airdrop.",
      "expected_outcome": "You will have a clear understanding of what is needed to qualify for the airdrop."
    },
    {
      "step_number": 2,
      "title": "Set Up a Compatible Wallet",
      "type": "execution",
      "description": "Create or ensure you have a cryptocurrency wallet that supports Arbitrum and airdrop participation.",
      "expected_outcome": "You will be ready to receive the airdrop in a compatible wallet."
    }
  ],
  "estimated_timeline": "2-4 weeks for successful participation and airdrop claim",
  "success_metrics": [
    "Successfully completed all airdrop participation steps",
    "Received airdrop tokens in your wallet",
    "Maintained investment within $500"
  ]
}`;

export const mockPerplexityResponse = `{
  "findings": [
    {
      "topic": "Arbitrum Airdrop Requirements and Eligibility (2025)",
      "summary": "The latest Arbitrum airdrop targets active users on specific Arbitrum DeFi protocols.",
      "relevance_score": 9.5,
      "sources": ["3"]
    },
    {
      "topic": "Technical Steps to Participate",
      "summary": "Participants must set up a compatible crypto wallet supporting the Arbitrum network.",
      "relevance_score": 9,
      "sources": ["3"]
    }
  ],
  "overall_assessment": "Participating in the latest Arbitrum airdrop requires active engagement with specific DeFi protocols."
}`;
