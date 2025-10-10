import { Injectable, Logger } from '@nestjs/common';
import { OpenAISingleton, PerplexitySingleton } from '../shared/singletons';
import { AgentMessageDto, AgentResponseDto } from './dto/agent-message.dto';
import {
  AgentContext,
  PlanningResponse,
  ResearchResponse,
  JudgeResponse,
  WalletAction,
  WalletResult,
} from './types/agent.types';
import { WalletAgentTool, PlanGeneratorTool } from './tools';
import {
  PLANNING_AGENT_PROMPT,
  RESEARCH_AGENT_PROMPT,
  JUDGE_AGENT_PROMPT,
} from './constants/agent-prompts';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly openAI: OpenAISingleton,
    private readonly perplexity: PerplexitySingleton,
    private readonly walletTool: WalletAgentTool,
    private readonly planGenerator: PlanGeneratorTool,
  ) {}

  async processMessage(dto: AgentMessageDto): Promise<AgentResponseDto> {
    try {
      // Initialize agent context
      const context: AgentContext = {
        userIntent: dto.message,
        userPreferences: dto.preferences || {},
        cycleCount: 0,
      };

      // Start the coordinator workflow
      return await this.runCoordinatorWorkflow(context);
    } catch (error) {
      this.logger.error(
        `Error processing message: ${error.message}`,
        error.stack,
      );
      return {
        message: `An error occurred: ${error.message}`,
        status: 'failed',
      };
    }
  }

  private async runCoordinatorWorkflow(
    context: AgentContext,
  ): Promise<AgentResponseDto> {
    // Maximum number of cycles to prevent infinite loops
    const MAX_CYCLES = 3;

    while (context.cycleCount < MAX_CYCLES) {
      context.cycleCount++;
      this.logger.log(`Starting cycle ${context.cycleCount}`);

      // Step 1: Planning Agent
      if (
        !context.planningResult ||
        context.judgeResult?.decision === 'needs_revision'
      ) {
        const planningPrompt = this.buildPlanningPrompt(context);
        const planningResponse = await this.callPlanningAgent(planningPrompt);
        context.planningResult = planningResponse;
      }

      // Step 2: Research Agent
      const researchPrompt = this.buildResearchPrompt(context);
      const researchResponse = await this.callResearchAgent(researchPrompt);
      context.researchResult = researchResponse;

      // Step 3: Judge Agent
      const judgePrompt = this.buildJudgePrompt(context);
      const judgeResponse = await this.callJudgeAgent(judgePrompt);
      context.judgeResult = judgeResponse;

      // Check if the plan is approved
      if (judgeResponse.decision === 'approved') {
        // Step 4: Extract wallet actions from the plan if any
        if (!context.walletAction && context.planningResult) {
          context.walletAction = await this.extractWalletActionsFromPlan(
            context.planningResult,
          );
        }

        // Step 5: Execute wallet operations if needed
        if (context.walletAction) {
          this.logger.log('Plan approved, executing wallet operations');
          const walletResult = await this.executeWalletOperation(context);
          context.walletResult = walletResult;

          // If wallet operation failed, update the status
          if (!walletResult.success) {
            return {
              message: `Wallet operation failed: ${walletResult.error}`,
              plan: context.planningResult,
              research: context.researchResult,
              decision: context.judgeResult,
              wallet: walletResult,
              status: 'failed',
            };
          }
        }

        return this.buildFinalResponse(context);
      }

      // If rejected and we've reached max cycles, return with failure
      if (context.cycleCount >= MAX_CYCLES) {
        return {
          message: 'Maximum revision cycles reached without an approved plan.',
          plan: context.planningResult,
          research: context.researchResult,
          decision: context.judgeResult,
          wallet: context.walletResult,
          status: 'failed',
        };
      }

      // Otherwise, continue to the next cycle for revision
      this.logger.log(
        `Plan needs revision. Starting cycle ${context.cycleCount + 1}`,
      );
    }

    // This should not be reached due to the while loop condition
    return {
      message: 'Workflow completed without resolution.',
      status: 'failed',
    };
  }

  private buildPlanningPrompt(context: AgentContext): string {
    let prompt = PLANNING_AGENT_PROMPT + '\n\n';
    prompt += `User Intent: ${context.userIntent}\n\n`;

    if (
      context.userPreferences &&
      Object.keys(context.userPreferences).length > 0
    ) {
      prompt += `User Preferences: ${JSON.stringify(
        context.userPreferences,
        null,
        2,
      )}\n\n`;
    }

    if (context.judgeResult?.decision === 'needs_revision') {
      prompt += `Previous Plan Feedback: ${context.judgeResult.reasoning}\n\n`;
      prompt += `Improvement Suggestions: ${JSON.stringify(
        context.judgeResult.improvement_suggestions,
        null,
        2,
      )}\n\n`;
    }

    return prompt;
  }

  private buildResearchPrompt(context: AgentContext): string {
    let prompt = RESEARCH_AGENT_PROMPT + '\n\n';
    prompt += `User Intent: ${context.userIntent}\n\n`;
    prompt += `Plan to Research: ${JSON.stringify(
      context.planningResult,
      null,
      2,
    )}\n\n`;
    prompt +=
      'Please research the information needed to validate and enhance this plan.';

    return prompt;
  }

  private buildJudgePrompt(context: AgentContext): string {
    let prompt = JUDGE_AGENT_PROMPT + '\n\n';
    prompt += `User Intent: ${context.userIntent}\n\n`;

    if (
      context.userPreferences &&
      Object.keys(context.userPreferences).length > 0
    ) {
      prompt += `User Preferences: ${JSON.stringify(
        context.userPreferences,
        null,
        2,
      )}\n\n`;
    }

    prompt += `Plan to Evaluate: ${JSON.stringify(
      context.planningResult,
      null,
      2,
    )}\n\n`;
    prompt += `Research Findings: ${JSON.stringify(
      context.researchResult,
      null,
      2,
    )}\n\n`;
    prompt +=
      'Please evaluate this plan based on the research findings and user preferences.';

    return prompt;
  }

  private async callPlanningAgent(prompt: string): Promise<PlanningResponse> {
    try {
      this.logger.log('Calling planning agent');

      // Extract context from the prompt
      const userIntent = this.extractUserIntentFromPrompt(prompt);
      const userPreferences = this.extractUserPreferencesFromPrompt(prompt);
      const previousFeedback = this.extractPreviousFeedbackFromPrompt(prompt);
      const improvementSuggestions =
        this.extractImprovementSuggestionsFromPrompt(prompt);

      // Use the plan generator tool
      const result = await this.planGenerator.generatePlan({
        userIntent,
        userPreferences,
        previousFeedback,
        improvementSuggestions,
      });

      if (!result.success || !result.plan) {
        throw new Error(result.error || 'Failed to generate plan');
      }

      return result.plan;
    } catch (error) {
      this.logger.error(
        `Error calling planning agent: ${error.message}`,
        error.stack,
      );
      throw new Error(`Planning agent failed: ${error.message}`);
    }
  }

  /**
   * Extract user intent from the planning prompt
   */
  private extractUserIntentFromPrompt(prompt: string): string {
    const intentMatch = prompt.match(/User Intent: (.+?)(?:\n|$)/i);
    return intentMatch ? intentMatch[1].trim() : '';
  }

  /**
   * Extract user preferences from the planning prompt
   */
  private extractUserPreferencesFromPrompt(
    prompt: string,
  ): Record<string, any> {
    try {
      const preferencesMatch = prompt.match(
        /User Preferences: (\{[\s\S]*?\})(?:\n|$)/i,
      );
      if (preferencesMatch && preferencesMatch[1]) {
        return JSON.parse(preferencesMatch[1]);
      }
    } catch (error) {
      this.logger.error(`Error parsing user preferences: ${error.message}`);
    }
    return {};
  }

  /**
   * Extract previous feedback from the planning prompt
   */
  private extractPreviousFeedbackFromPrompt(
    prompt: string,
  ): string | undefined {
    const feedbackMatch = prompt.match(
      /Previous Plan Feedback: (.+?)(?:\n|$)/i,
    );
    return feedbackMatch ? feedbackMatch[1].trim() : undefined;
  }

  /**
   * Extract improvement suggestions from the planning prompt
   */
  private extractImprovementSuggestionsFromPrompt(prompt: string): string[] {
    const suggestionsMatch = prompt.match(
      /Improvement Suggestions: (\[[\s\S]*?\])(?:\n|$)/i,
    );
    if (suggestionsMatch && suggestionsMatch[1]) {
      try {
        return JSON.parse(suggestionsMatch[1]);
      } catch (error) {
        this.logger.error(
          `Error parsing improvement suggestions: ${error.message}`,
        );
      }
    }
    return [];
  }

  private async callResearchAgent(prompt: string): Promise<ResearchResponse> {
    try {
      this.logger.log('Calling research agent');
      const response = await this.perplexity.research(prompt);
      return this.parseJsonResponse<ResearchResponse>(response);
    } catch (error) {
      this.logger.error(
        `Error calling research agent: ${error.message}`,
        error.stack,
      );
      throw new Error(`Research agent failed: ${error.message}`);
    }
  }

  private async callJudgeAgent(prompt: string): Promise<JudgeResponse> {
    try {
      const response = await this.openAI.think(prompt);
      return this.parseJsonResponse<JudgeResponse>(response);
    } catch (error) {
      this.logger.error(
        `Error calling judge agent: ${error.message}`,
        error.stack,
      );
      throw new Error(`Judge agent failed: ${error.message}`);
    }
  }

  private parseJsonResponse<T>(response: string): T {
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonStr = jsonMatch[0];
      return JSON.parse(jsonStr) as T;
    } catch (error) {
      this.logger.error(
        `Error parsing JSON response: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to parse agent response: ${error.message}`);
    }
  }

  private buildFinalResponse(context: AgentContext): AgentResponseDto {
    return {
      message: 'Plan approved! Here are the details:',
      plan: context.planningResult,
      research: context.researchResult,
      decision: context.judgeResult,
      wallet: context.walletResult,
      status: 'completed',
    };
  }

  /**
   * Extract wallet actions from the approved plan
   */
  private async extractWalletActionsFromPlan(
    plan: PlanningResponse,
  ): Promise<WalletAction | undefined> {
    try {
      // Use the plan generator tool to extract wallet operations
      const walletOperation = await this.planGenerator.extractWalletOperations(
        plan,
      );
      return walletOperation as WalletAction | undefined;
    } catch (error) {
      this.logger.error(
        `Error extracting wallet actions: ${error.message}`,
        error.stack,
      );
      return undefined;
    }
  }

  /**
   * Execute wallet operations based on the agent context
   */
  private async executeWalletOperation(
    context: AgentContext,
  ): Promise<WalletResult> {
    if (!context.walletAction) {
      return {
        success: false,
        message: 'No wallet action specified',
        error: 'Missing wallet action in context',
      };
    }

    try {
      this.logger.log(
        `Executing wallet operation: ${context.walletAction.type}`,
      );

      // Analyze transaction safety first
      const safetyAnalysis = await this.walletTool.analyzeTransactionSafety({
        action: context.walletAction.type,
        parameters: context.walletAction.parameters,
      });

      if (!safetyAnalysis.safe) {
        return {
          success: false,
          message: `Wallet operation rejected: ${safetyAnalysis.reason}`,
          error: safetyAnalysis.reason,
        };
      }

      // Execute the wallet operation
      const result = await this.walletTool.execute({
        action: context.walletAction.type,
        parameters: context.walletAction.parameters,
      });

      return {
        success: result.success,
        message: result.message,
        address: result.data?.address,
        balance: result.data?.balance,
        transactionHash: result.data?.transactionHash,
        explorerUrl: result.data?.explorerUrl,
        error: result.error,
      };
    } catch (error) {
      this.logger.error(
        `Error executing wallet operation: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Wallet operation failed',
        error: error.message,
      };
    }
  }
}
