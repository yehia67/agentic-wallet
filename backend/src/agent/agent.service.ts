import { Injectable, Logger } from '@nestjs/common';
import { OpenAISingleton, PerplexitySingleton } from '../shared/singletons';
import {
  AgentMessageDto,
  AgentResponseDto,
  AgentMode,
} from './dto/agent-message.dto';
import { CapabilitiesResponseDto, CapabilityDto } from './dto/capabilities.dto';
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
import { NFTService } from './services/nft.service';

interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: AgentResponseDto;
  error?: string;
  createdAt: Date;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly sessionStore = new Map<
    string,
    { mode?: AgentMode; preferences?: Record<string, any> }
  >();
  private readonly jobStore = new Map<string, JobStatus>();

  constructor(
    private readonly openAI: OpenAISingleton,
    private readonly perplexity: PerplexitySingleton,
    private readonly walletTool: WalletAgentTool,
    private readonly planGenerator: PlanGeneratorTool,
    private readonly nftService: NFTService,
  ) {
    // Clean up old jobs every 5 minutes
    setInterval(() => this.cleanupOldJobs(), 5 * 60 * 1000);
  }

  /**
   * Start async job and return job ID immediately
   */
  async startAsyncJob(dto: AgentMessageDto): Promise<{ jobId: string }> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create job entry
    this.jobStore.set(jobId, {
      id: jobId,
      status: 'pending',
      createdAt: new Date(),
    });

    // Process in background
    this.processMessageAsync(jobId, dto).catch((error) => {
      this.logger.error(`Async job ${jobId} failed: ${error.message}`);
      this.jobStore.set(jobId, {
        id: jobId,
        status: 'failed',
        error: error.message,
        createdAt: new Date(),
      });
    });

    return { jobId };
  }

  /**
   * Get job status and result
   */
  getJobStatus(jobId: string): JobStatus | null {
    return this.jobStore.get(jobId) || null;
  }

  /**
   * Process message asynchronously
   */
  private async processMessageAsync(
    jobId: string,
    dto: AgentMessageDto,
  ): Promise<void> {
    // Update status to processing
    const job = this.jobStore.get(jobId);
    if (job) {
      job.status = 'processing';
      this.jobStore.set(jobId, job);
    }

    // Process the message
    const result = await this.processMessage(dto);

    // Store result
    this.jobStore.set(jobId, {
      id: jobId,
      status: 'completed',
      result,
      createdAt: job?.createdAt || new Date(),
    });
  }

  async processMessage(dto: AgentMessageDto): Promise<AgentResponseDto> {
    try {
      // Get or create session
      const sessionId = dto.sessionId || 'default';
      const session = this.getOrCreateSession(
        sessionId,
        dto.mode,
        dto.preferences,
      );

      // Initialize agent context
      const context: AgentContext = {
        userIntent: dto.message,
        sessionId,
        mode: dto.mode || session.mode || 'auto',
        userPreferences: { ...session.preferences, ...dto.preferences },
        cycleCount: 0,
      };

      // Start with welcome message if this is a greeting or first interaction
      const welcomeResponse = this.checkForWelcomeMessage(dto.message);
      if (welcomeResponse) {
        return welcomeResponse;
      }

      // Determine execution mode
      const modeDecision = this.determineExecutionMode(context);

      if (modeDecision.requiresModeSelection) {
        return {
          message: modeDecision.message,
          status: 'completed',
          requiresModeSelection: true,
          suggestedMode: modeDecision.suggestedMode,
        };
      }

      // Execute based on determined mode
      context.mode = modeDecision.mode;
      this.updateSession(sessionId, { mode: context.mode });

      if (context.mode === 'execution') {
        return await this.executeDirectAction(context);
      } else {
        return await this.runCoordinatorWorkflow(context);
      }
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

  private checkForWelcomeMessage(message: string): AgentResponseDto | null {
    const greetings = [
      'hello',
      'hi',
      'hey',
      'welcome',
      'start',
      'help',
      'capabilities',
    ];
    const lowerMessage = message.toLowerCase();

    if (greetings.some((greeting) => lowerMessage.includes(greeting))) {
      return {
        message: this.getWelcomeMessage(),
        status: 'completed',
      };
    }

    return null;
  }

  private getWelcomeMessage(): string {
    return `🤖 Welcome to the Agentic Wallet Platform!

I'm your AI assistant capable of helping you with various blockchain and wallet operations. Here's what I can do:

📋 **Core Capabilities:**
• **Planning Agent**: Create detailed plans for your blockchain operations
• **Research Agent**: Research market data, token information, and DeFi protocols  
• **Judge Agent**: Evaluate transaction safety and provide risk assessments
• **Wallet Operations**: Execute transactions, check balances, and manage tokens
• **NFT Minting**: Create and mint custom NFTs with metadata

🔧 **Available Tools:**
• Wallet balance checking
• Token transfers and approvals
• Batch transaction processing
• NFT creation and minting
• Transaction safety analysis
• Market research and analysis

💡 **How to use:**
Simply describe what you want to do, and I'll create a plan, research the necessary information, evaluate the safety, and execute the operations if approved.

Examples:
- "Check my wallet balance"
- "Send 10 USDC to 0x..."  
- "Mint an NFT with custom metadata"
- "Research the best DeFi yield farming opportunities"

Ready to help! What would you like to do?`;
  }

  async getCapabilities(): Promise<CapabilitiesResponseDto> {
    const capabilities: CapabilityDto[] = [
      {
        name: 'Planning Agent',
        description:
          'Creates detailed execution plans for blockchain operations',
        category: 'Planning',
        parameters: ['userIntent', 'userPreferences', 'previousFeedback'],
        endpoint: '/agent/message',
      },
      {
        name: 'Research Agent',
        description:
          'Researches market data, protocols, and blockchain information',
        category: 'Research',
        parameters: ['query', 'context'],
        endpoint: '/agent/research',
      },
      {
        name: 'Judge Agent',
        description:
          'Evaluates transaction safety and provides risk assessments',
        category: 'Safety',
        parameters: ['plan', 'researchFindings'],
        endpoint: '/agent/judge',
      },
      {
        name: 'Wallet Operations',
        description: 'Execute wallet transactions and check balances',
        category: 'Wallet',
        parameters: ['action', 'parameters'],
        endpoint: '/wallet',
      },
      {
        name: 'NFT Minting',
        description: 'Create and mint custom NFTs with metadata',
        category: 'NFT',
        parameters: [
          'to',
          'metadata',
          'royaltyPercentage',
          'subscriptionPrice',
        ],
        endpoint: '/nft/mint',
      },
    ];

    return {
      welcome_message: this.getWelcomeMessage(),
      capabilities,
      platform_info:
        'Agentic Wallet Platform - AI-powered blockchain operations with multi-agent coordination',
    };
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
      const walletOperation =
        await this.planGenerator.extractWalletOperations(plan);
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

  // Session management methods
  private getOrCreateSession(
    sessionId: string,
    mode?: AgentMode,
    preferences?: Record<string, any>,
  ) {
    if (!this.sessionStore.has(sessionId)) {
      this.sessionStore.set(sessionId, {
        mode: mode || 'auto',
        preferences: preferences || {},
      });
    }
    return this.sessionStore.get(sessionId)!;
  }

  private updateSession(
    sessionId: string,
    updates: { mode?: AgentMode; preferences?: Record<string, any> },
  ) {
    const session = this.sessionStore.get(sessionId) || {};
    this.sessionStore.set(sessionId, { ...session, ...updates });
  }

  // Mode determination logic
  private determineExecutionMode(context: AgentContext): {
    mode: AgentMode;
    requiresModeSelection?: boolean;
    message?: string;
    suggestedMode?: AgentMode;
  } {
    const message = context.userIntent.toLowerCase();

    // If mode is explicitly set, use it
    if (context.mode && context.mode !== 'auto') {
      return { mode: context.mode };
    }

    // Direct execution patterns (simple tasks)
    const executionPatterns = [
      /check.*balance.*0x[a-fA-F0-9]{40}/, // Check balance of specific address
      /what.*balance.*0x[a-fA-F0-9]{40}/, // What's the balance of address
      /balance.*0x[a-fA-F0-9]{40}/, // Balance of address
      /create.*wallet/, // Create wallet
      /generate.*wallet/, // Generate wallet
      /my.*balance/, // My balance
      /send.*\d+.*to.*0x/, // Send X tokens to address
      /transfer.*\d+/, // Transfer amount
      /mint.*nft/, // Mint NFT
      /approve.*token/, // Approve token
    ];

    // Planning patterns (complex strategies)
    const planningPatterns = [
      /strategy.*accumulate/, // Strategy to accumulate
      /how.*accumulate/, // How to accumulate
      /plan.*invest/, // Plan to invest
      /defi.*opportunity/, // DeFi opportunities
      /yield.*farming/, // Yield farming
      /best.*way.*to/, // Best way to do something
      /roadmap/, // Roadmap requests
      /step.*by.*step/, // Step by step guides
      /entry.*point/, // Entry point for investments
    ];

    // Check for direct execution patterns
    if (executionPatterns.some((pattern) => pattern.test(message))) {
      return { mode: 'execution' };
    }

    // Check for planning patterns
    if (planningPatterns.some((pattern) => pattern.test(message))) {
      return { mode: 'planning' };
    }

    // Ambiguous cases - ask user for preference
    const ambiguousPatterns = [
      /eth/,
      /btc/,
      /usdc/,
      /token/,
      /crypto/,
      /blockchain/,
      /swap/,
      /trade/,
    ];

    if (ambiguousPatterns.some((pattern) => pattern.test(message))) {
      return {
        mode: 'auto',
        requiresModeSelection: true,
        suggestedMode: 'execution',
        message: `I can help you with that! Would you like me to:

🔧 **Execute directly** - I'll perform the action immediately (recommended for simple tasks like checking balances, transfers, etc.)

📋 **Create a plan** - I'll research and create a detailed strategy with risk assessment (recommended for complex operations like DeFi strategies)

Please specify your preference or I'll default to execution mode.`,
      };
    }

    // Default to planning for safety
    return { mode: 'planning' };
  }

  // Direct execution method for simple tasks
  private async executeDirectAction(
    context: AgentContext,
  ): Promise<AgentResponseDto> {
    const message = context.userIntent.toLowerCase();

    try {
      // Balance checking
      if (message.includes('balance')) {
        const addressMatch = context.userIntent.match(/0x[a-fA-F0-9]{40}/);
        if (addressMatch) {
          const address = addressMatch[0];
          const result = await this.walletTool.execute({
            action: 'check_balance',
            parameters: { to: address },
          });

          const ethBalance = result.data?.ethBalance || 0;
          const usdcBalance = result.data?.usdcBalance || 0;

          return {
            message: `Balance for ${address}:\n• ETH: ${ethBalance.toFixed(6)} ETH\n• USDC: ${usdcBalance.toFixed(2)} USDC`,
            wallet: result,
            status: 'completed',
            mode: 'execution',
          };
        } else if (message.includes('my balance')) {
          const result = await this.walletTool.execute({
            action: 'check_balance',
          });

          const ethBalance = result.data?.ethBalance || 0;
          const usdcBalance = result.data?.usdcBalance || 0;

          return {
            message: `Your wallet balance:\n• ETH: ${ethBalance.toFixed(6)} ETH\n• USDC: ${usdcBalance.toFixed(2)} USDC`,
            wallet: result,
            status: 'completed',
            mode: 'execution',
          };
        }
      }

      // Wallet creation
      if (
        message.includes('create wallet') ||
        message.includes('generate wallet')
      ) {
        // For wallet creation, we might want to use a simple planning step
        // to ensure the user understands what they're doing
        const quickPlan = await this.generateQuickPlan(context.userIntent);
        return {
          message: quickPlan,
          status: 'completed',
          mode: 'execution',
        };
      }

      // If we can't handle it directly, fall back to planning
      this.logger.log(
        'Direct execution not possible, falling back to planning mode',
      );
      return await this.runCoordinatorWorkflow({
        ...context,
        mode: 'planning',
      });
    } catch (error) {
      this.logger.error(`Direct execution failed: ${error.message}`);
      return {
        message: `Direct execution failed: ${error.message}. Let me create a plan instead.`,
        status: 'failed',
        mode: 'execution',
      };
    }
  }

  // Quick plan generation for simple tasks
  private async generateQuickPlan(userIntent: string): Promise<string> {
    try {
      const prompt = `Generate a brief, actionable response for this user request: "${userIntent}"
      
Keep it concise and practical. If it's a simple task, provide direct instructions.
If it requires caution, mention key risks briefly.`;

      const response = await this.openAI.think(
        `System: You are a helpful blockchain assistant. Provide concise, practical responses.\n\nUser: ${prompt}`,
      );

      return response || 'I can help you with that task.';
    } catch (error) {
      this.logger.error(`Quick plan generation failed: ${error.message}`);
      return "I can help you with that. Please provide more details about what you'd like to do.";
    }
  }

  /**
   * Clean up jobs older than 30 minutes
   */
  private cleanupOldJobs(): void {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    let cleaned = 0;

    for (const [jobId, job] of this.jobStore.entries()) {
      if (job.createdAt < thirtyMinutesAgo) {
        this.jobStore.delete(jobId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} old jobs`);
    }
  }
}
