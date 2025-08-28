/**
 * Thinking Tool Validator - Validates .cogito file structure
 */

export class ThinkingToolValidator {
  /**
   * Validate the .cogito file structure
   */
  static async validateStructure(toolData) {
    if (!toolData || typeof toolData !== 'object') {
      throw new Error('Invalid .cogito file: not a valid JSON object');
    }
    
    if (!toolData.version) {
      throw new Error('Invalid .cogito file: missing version field');
    }
    
    if (!toolData.artifact || !toolData.data) {
      throw new Error('Invalid .cogito file: missing artifact or data field');
    }
    
    if (!toolData.artifact.name || !toolData.artifact.prompt) {
      throw new Error('Invalid .cogito file: missing artifact name or prompt');
    }
    
    return true;
  }
}