/**
 * Interaction Classifier - Modular version with specialized components
 * 
 * For Auto-Recording Session Context
 * Distinguishes between planning discussions, milestones, and execution
 */

import { MilestoneDetector } from './interaction-classifier/milestone-detector.js';
import { PlanningDetector } from './interaction-classifier/planning-detector.js';
import { ThinkingDetector } from './interaction-classifier/thinking-detector.js';
import { InteractionFilter } from './interaction-classifier/interaction-filter.js';

export class InteractionClassifier {
  
  /**
   * Classify an interaction based on content patterns
   * @param {string} humanInput - The human's input
   * @param {string} assistantResponse - The assistant's response
   * @returns {Object} Classification result
   */
  static classifyInteraction(humanInput, assistantResponse) {
    const classification = {
      shouldRecord: false,
      contextType: null,
      contextUpdate: null,
      milestone: null,
      thinkingProcess: null
    };

    // Check for analytical thinking and reasoning chains
    const thinkingResult = ThinkingDetector.detectThinkingProcess(humanInput, assistantResponse);
    if (thinkingResult.hasThinking) {
      classification.thinkingProcess = thinkingResult;
    }

    // Check for milestone patterns in assistant response
    const milestoneResult = MilestoneDetector.detectMilestone(assistantResponse);
    if (milestoneResult.isMilestone) {
      classification.shouldRecord = true;
      classification.contextType = 'milestone';
      classification.contextUpdate = milestoneResult.summary;
      classification.milestone = milestoneResult.milestone;
      return classification;
    }

    // Check for planning discussions
    const planningResult = PlanningDetector.detectPlanning(humanInput, assistantResponse);
    if (planningResult.isPlanning) {
      classification.shouldRecord = true;
      classification.contextType = 'planning';
      classification.contextUpdate = planningResult.summary;
      return classification;
    }

    // If we have significant thinking but no other category, record as insight
    if (thinkingResult.hasThinking && thinkingResult.significance !== 'minor') {
      classification.shouldRecord = true;
      classification.contextType = 'insight';
      classification.contextUpdate = thinkingResult.summary;
      return classification;
    }

    // Not worth recording
    return classification;
  }

  /**
   * Should skip recording (execution/debugging activities)
   * @param {string} humanInput - Human input text
   * @param {string} assistantResponse - Assistant response text
   * @returns {boolean} - True if interaction should be skipped
   */
  static shouldSkipRecording(humanInput, assistantResponse) {
    return InteractionFilter.shouldSkipRecording(humanInput, assistantResponse);
  }

  /**
   * Check if interaction meets minimum quality thresholds
   * @param {string} humanInput - Human input text
   * @param {string} assistantResponse - Assistant response text
   * @returns {boolean} - True if interaction meets quality thresholds
   */
  static meetsQualityThreshold(humanInput, assistantResponse) {
    return InteractionFilter.meetsQualityThreshold(humanInput, assistantResponse);
  }

  /**
   * Determine if interaction is routine/repetitive
   * @param {string} humanInput - Human input text
   * @param {string} assistantResponse - Assistant response text
   * @returns {boolean} - True if interaction is routine
   */
  static isRoutineInteraction(humanInput, assistantResponse) {
    return InteractionFilter.isRoutineInteraction(humanInput, assistantResponse);
  }

  /**
   * Convenience method to get access to specialized modules
   */
  static get modules() {
    return {
      milestone: MilestoneDetector,
      planning: PlanningDetector,
      thinking: ThinkingDetector,
      filter: InteractionFilter
    };
  }
}