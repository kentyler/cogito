/**
 * Turn creation and response handling for conversational REPL
 */
import { createTurn } from './turn-compatibility.js';

export async function createUserTurn(req, { userId, content, meetingId }) {
  console.log('🔍 STEP 5: Creating user turn with meeting_id:', meetingId);
  
  try {
    const userTurn = await createTurn({
      req,
      turnData: {
        user_id: userId,
        content: content,
        source_type: 'conversational-repl-user',
        metadata: {},
        meeting_id: meetingId
      }
    });
    console.log('🔍 STEP 5a: User turn created successfully:', userTurn.id);
    return userTurn;
  } catch (error) {
    console.error('🔍 STEP 5b: Failed to create user turn:', error);
    throw error;
  }
}

export async function createLLMTurn(req, { userId, llmResponse, userTurn, meetingId }) {
  let llmTurn;
  
  // Check if this is a response-set (multiple alternatives)
  if (llmResponse.includes(':response-set')) {
    try {
      // Store the complete response-set as a single turn
      llmTurn = await createTurn({
        req,
        turnData: {
          user_id: userId,
          content: llmResponse,
          source_type: 'conversational-repl-llm',
          source_id: userTurn.id,
          meeting_id: meetingId,
          metadata: { 
            user_turn_id: userTurn.id,
            response_type: 'response-set',
            has_alternatives: true
          }
        }
      });
    } catch (parseError) {
      console.error('Error storing response-set:', parseError);
      // Fallback to single response
      llmTurn = await createTurn({
        req,
        turnData: {
          user_id: userId,
          content: llmResponse,
          source_type: 'conversational-repl-llm',
          source_id: userTurn.id,
          meeting_id: meetingId,
          metadata: { 
            user_turn_id: userTurn.id,
            response_type: 'clojure-data'
          }
        }
      });
    }
  } else {
    // Store single response
    llmTurn = await createTurn({
      req,
      turnData: {
        user_id: userId,
        content: llmResponse,
        source_type: 'conversational-repl-llm',
        source_id: userTurn.id,
        meeting_id: meetingId,
        metadata: { 
          user_turn_id: userTurn.id,
          response_type: 'clojure-data'
        }
      }
    });
  }
  
  return llmTurn;
}