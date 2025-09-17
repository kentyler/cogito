import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { DatabaseAgent } from '../database/database-agent.js';

describe('Turn Addressing Logic', () => {
  let dbAgent;
  
  beforeAll(async () => {
    dbAgent = new DatabaseAgent();
    await dbAgent.connect();
  });
  
  afterAll(async () => {
    await dbAgent.close();
  });

  describe('parseAddressing', () => {
    it('should detect solitary @ for Cogito addressing', () => {
      const testCases = [
        { content: '@ what do you think?', expected: { shouldInvokeCogito: true, userMentions: [], isComment: false } },
        { content: 'Hey @ can you help?', expected: { shouldInvokeCogito: true, userMentions: [], isComment: false } },
        { content: 'What about this approach @?', expected: { shouldInvokeCogito: true, userMentions: [], isComment: false } },
      ];

      testCases.forEach(({ content, expected }) => {
        const result = dbAgent.turns.parseAddressing(content);
        expect(result.shouldInvokeCogito).toBe(expected.shouldInvokeCogito);
        expect(result.userMentions).toEqual(expected.userMentions);
        expect(result.isComment).toBe(expected.isComment);
      });
    });

    it('should detect user mentions', () => {
      const testCases = [
        { content: '@sarah what do you think?', expected: { shouldInvokeCogito: false, userMentions: ['sarah'], isComment: false } },
        { content: '@john @mary check this out', expected: { shouldInvokeCogito: false, userMentions: ['john', 'mary'], isComment: false } },
      ];

      testCases.forEach(({ content, expected }) => {
        const result = dbAgent.turns.parseAddressing(content);
        expect(result.shouldInvokeCogito).toBe(expected.shouldInvokeCogito);
        expect(result.userMentions).toEqual(expected.userMentions);
        expect(result.isComment).toBe(expected.isComment);
      });
    });

    it('should detect comments (no addressing)', () => {
      const testCases = [
        { content: 'This is just a comment', expected: { shouldInvokeCogito: false, userMentions: [], isComment: true } },
        { content: 'I think this approach works well', expected: { shouldInvokeCogito: false, userMentions: [], isComment: true } },
        { content: 'email@domain.com is not a mention', expected: { shouldInvokeCogito: false, userMentions: [], isComment: true } },
      ];

      testCases.forEach(({ content, expected }) => {
        const result = dbAgent.turns.parseAddressing(content);
        expect(result.shouldInvokeCogito).toBe(expected.shouldInvokeCogito);
        expect(result.userMentions).toEqual(expected.userMentions);
        expect(result.isComment).toBe(expected.isComment);
      });
    });

    it('should handle mixed addressing patterns', () => {
      const testCases = [
        { 
          content: '@sarah @ what are your thoughts?', 
          expected: { shouldInvokeCogito: true, userMentions: ['sarah'], isComment: false } 
        },
        { 
          content: '@ and @john should review this', 
          expected: { shouldInvokeCogito: true, userMentions: ['john'], isComment: false } 
        },
      ];

      testCases.forEach(({ content, expected }) => {
        const result = dbAgent.turns.parseAddressing(content);
        expect(result.shouldInvokeCogito).toBe(expected.shouldInvokeCogito);
        expect(result.userMentions).toEqual(expected.userMentions);
        expect(result.isComment).toBe(expected.isComment);
      });
    });

    it('should not trigger on email addresses or @@ patterns', () => {
      const testCases = [
        { content: 'Contact me at user@domain.com', expected: { shouldInvokeCogito: false, userMentions: [], isComment: true } },
        { content: 'Use @@variable in the code', expected: { shouldInvokeCogito: false, userMentions: [], isComment: true } },
        { content: '@user@domain.com is an email', expected: { shouldInvokeCogito: false, userMentions: [], isComment: true } },
      ];

      testCases.forEach(({ content, expected }) => {
        const result = dbAgent.turns.parseAddressing(content);
        expect(result.shouldInvokeCogito).toBe(expected.shouldInvokeCogito);
        expect(result.userMentions).toEqual(expected.userMentions);
        expect(result.isComment).toBe(expected.isComment);
      });
    });
  });

  describe('createTurnWithAddressing', () => {
    it('should create turn with addressing metadata', async () => {
      const turnData = {
        meeting_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 1,
        content: '@ what do you think about this approach?',
        metadata: { original: true }
      };

      const result = await dbAgent.turns.createTurnWithAddressing(turnData);
      
      expect(result).toBeDefined();
      expect(result.metadata.addressing).toBeDefined();
      expect(result.metadata.addressing.shouldInvokeCogito).toBe(true);
      expect(result.metadata.addressing.isComment).toBe(false);
      expect(result.metadata.original).toBe(true);
    });
  });
});