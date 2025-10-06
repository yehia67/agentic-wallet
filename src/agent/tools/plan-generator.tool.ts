import { Injectable, Logger } from '@nestjs/common';
import { OpenAISingleton } from '../../shared/singletons';
import { PlanningResponse, PlanStep } from '../types/agent.types';

export interface PlanGeneratorRequest {
  userIntent: string;
  userPreferences?: Record<string, any>;
  previousFeedback?: string;
  improvementSuggestions?: string[];
}

export interface PlanGeneratorResponse {
  success: boolean;
  plan?: PlanningResponse;
  error?: string;
}

@Injectable()
export class PlanGeneratorTool {
  private readonly logger = new Logger(PlanGeneratorTool.name);

  constructor(private readonly openAI: OpenAISingleton) {}

  /**
   * Generate a plan based on user intent and preferences
   */
  async generatePlan(
    request: PlanGeneratorRequest,
  ): Promise<PlanGeneratorResponse> {
    try {
      this.logger.log('Generating plan based on user intent');

      // Build prompt for the planning agent
      const prompt = this.buildPlanningPrompt(request);

      // Call the OpenAI API to generate a plan
      const response = await this.openAI.think(prompt);

      // Parse the response to extract the plan
      const plan = this.parsePlanResponse(response);

      if (!plan) {
        return {
          success: false,
          error: 'Failed to generate a valid plan',
        };
      }

      return {
        success: true,
        plan,
      };
    } catch (error) {
      this.logger.error(`Error generating plan: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Plan generation failed: ${error.message}`,
      };
    }
  }

  /**
   * Build a prompt for the planning agent
   */
  private buildPlanningPrompt(request: PlanGeneratorRequest): string {
    let prompt = `You are a Planning Agent responsible for creating detailed, step-by-step plans to help users achieve their financial and blockchain-related goals.\n\n`;

    prompt += `USER INTENT: ${request.userIntent}\n\n`;

    if (
      request.userPreferences &&
      Object.keys(request.userPreferences).length > 0
    ) {
      prompt += `USER PREFERENCES:\n${JSON.stringify(
        request.userPreferences,
        null,
        2,
      )}\n\n`;
    }

    if (request.previousFeedback) {
      prompt += `PREVIOUS FEEDBACK: ${request.previousFeedback}\n\n`;
    }

    if (
      request.improvementSuggestions &&
      request.improvementSuggestions.length > 0
    ) {
      prompt += `IMPROVEMENT SUGGESTIONS:\n`;
      request.improvementSuggestions.forEach((suggestion, index) => {
        prompt += `${index + 1}. ${suggestion}\n`;
      });
      prompt += '\n';
    }

    prompt += `INSTRUCTIONS:
1. Create a comprehensive plan with clear, actionable steps
2. Each step should include a title, type (research, analysis, execution), description, and expected outcome
3. Consider the user's preferences and constraints
4. Include realistic timeline estimates
5. Define clear success metrics

Respond with a JSON object in the following format:
{
  "goal": "Clear statement of the goal",
  "constraints": ["List of constraints based on user preferences"],
  "steps": [
    {
      "step_number": 1,
      "title": "Step Title",
      "type": "research|analysis|execution",
      "description": "Detailed description of what to do",
      "expected_outcome": "What will be achieved after this step"
    },
    ...more steps...
  ],
  "estimated_timeline": "Realistic timeline for completion",
  "success_metrics": ["List of measurable outcomes that indicate success"]
}

Ensure your plan is practical, comprehensive, and aligned with the user's intent and preferences.`;

    return prompt;
  }

  /**
   * Parse the response from the planning agent
   */
  private parsePlanResponse(response: string): PlanningResponse | null {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.error('No JSON found in planning response');
        return null;
      }

      const planData = JSON.parse(jsonMatch[0]);

      // Validate the plan structure
      if (!this.validatePlanStructure(planData)) {
        this.logger.error('Invalid plan structure');
        return null;
      }

      return planData as PlanningResponse;
    } catch (error) {
      this.logger.error(
        `Error parsing plan response: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Validate the structure of the generated plan
   */
  private validatePlanStructure(plan: any): boolean {
    if (!plan.goal || typeof plan.goal !== 'string') {
      return false;
    }

    if (!Array.isArray(plan.constraints)) {
      return false;
    }

    if (!Array.isArray(plan.steps) || plan.steps.length === 0) {
      return false;
    }

    // Check each step has the required fields
    for (const step of plan.steps) {
      if (
        !step.step_number ||
        !step.title ||
        !step.type ||
        !step.description ||
        !step.expected_outcome
      ) {
        return false;
      }
    }

    if (
      !plan.estimated_timeline ||
      typeof plan.estimated_timeline !== 'string'
    ) {
      return false;
    }

    if (
      !Array.isArray(plan.success_metrics) ||
      plan.success_metrics.length === 0
    ) {
      return false;
    }

    return true;
  }

  /**
   * Refine an existing plan based on feedback
   */
  async refinePlan(
    existingPlan: PlanningResponse,
    feedback: string,
    suggestions: string[],
  ): Promise<PlanGeneratorResponse> {
    try {
      this.logger.log('Refining plan based on feedback');

      // Build prompt for plan refinement
      const prompt = this.buildRefinementPrompt(
        existingPlan,
        feedback,
        suggestions,
      );

      // Call the OpenAI API to refine the plan
      const response = await this.openAI.think(prompt);

      // Parse the response to extract the refined plan
      const refinedPlan = this.parsePlanResponse(response);

      if (!refinedPlan) {
        return {
          success: false,
          error: 'Failed to refine the plan',
        };
      }

      return {
        success: true,
        plan: refinedPlan,
      };
    } catch (error) {
      this.logger.error(`Error refining plan: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Plan refinement failed: ${error.message}`,
      };
    }
  }

  /**
   * Build a prompt for plan refinement
   */
  private buildRefinementPrompt(
    existingPlan: PlanningResponse,
    feedback: string,
    suggestions: string[],
  ): string {
    let prompt = `You are a Planning Agent responsible for refining existing plans based on feedback.\n\n`;

    prompt += `EXISTING PLAN:\n${JSON.stringify(existingPlan, null, 2)}\n\n`;

    prompt += `FEEDBACK: ${feedback}\n\n`;

    if (suggestions && suggestions.length > 0) {
      prompt += `IMPROVEMENT SUGGESTIONS:\n`;
      suggestions.forEach((suggestion, index) => {
        prompt += `${index + 1}. ${suggestion}\n`;
      });
      prompt += '\n';
    }

    prompt += `INSTRUCTIONS:
1. Refine the existing plan to address the feedback and improvement suggestions
2. Maintain the same structure but improve the content
3. You may add, remove, or modify steps as needed
4. Ensure the refined plan is more aligned with the user's goals and constraints

Respond with a JSON object in the same format as the existing plan.`;

    return prompt;
  }

  /**
   * Extract wallet operations from a plan
   */
  async extractWalletOperations(plan: PlanningResponse): Promise<any> {
    try {
      this.logger.log('Extracting wallet operations from plan');

      // Check if there are any wallet-related steps in the plan
      const walletSteps = plan.steps.filter(
        (step) =>
          step.type.toLowerCase().includes('execution') &&
          (step.description.toLowerCase().includes('wallet') ||
            step.description.toLowerCase().includes('transaction') ||
            step.description.toLowerCase().includes('transfer') ||
            step.description.toLowerCase().includes('send') ||
            step.description.toLowerCase().includes('approve')),
      );

      if (walletSteps.length === 0) {
        return null;
      }

      // Build prompt for wallet operation extraction
      const prompt = this.buildWalletExtractionPrompt(plan, walletSteps);

      // Call the OpenAI API to extract wallet operations
      const response = await this.openAI.think(prompt);

      // Parse the response to extract wallet operations
      return this.parseWalletOperations(response);
    } catch (error) {
      this.logger.error(
        `Error extracting wallet operations: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Build a prompt for wallet operation extraction
   */
  private buildWalletExtractionPrompt(
    plan: PlanningResponse,
    walletSteps: PlanStep[],
  ): string {
    let prompt = `Extract wallet operations from the following plan steps:\n\n`;

    walletSteps.forEach((step) => {
      prompt += `Step ${step.step_number}: ${step.title}\n`;
      prompt += `Description: ${step.description}\n`;
      prompt += `Expected outcome: ${step.expected_outcome}\n\n`;
    });

    prompt += `Based on these steps, determine if any wallet operations are needed.\n`;
    prompt += `Return a JSON object with the following structure:\n`;
    prompt += `{\n`;
    prompt += `  "action": "check_balance" | "send_transaction" | "approve_token" | "batch_transactions" | null,\n`;
    prompt += `  "parameters": {\n`;
    prompt += `    "to": "address", // For send_transaction\n`;
    prompt += `    "data": "hex_data", // For send_transaction\n`;
    prompt += `    "spender": "address", // For approve_token\n`;
    prompt += `    "transactions": [ // For batch_transactions\n`;
    prompt += `      { "to": "address", "value": "amount", "data": "hex_data" }\n`;
    prompt += `    ]\n`;
    prompt += `  }\n`;
    prompt += `}\n\n`;
    prompt += `If no wallet operations are needed, return { "action": null }.\n`;

    return prompt;
  }

  /**
   * Parse wallet operations from the response
   */
  private parseWalletOperations(response: string): any {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const operationData = JSON.parse(jsonMatch[0]);

      if (
        !operationData.action ||
        operationData.action === 'null' ||
        operationData.action === null
      ) {
        return null;
      }

      return {
        type: operationData.action,
        parameters: operationData.parameters || {},
      };
    } catch (error) {
      this.logger.error(
        `Error parsing wallet operations: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
