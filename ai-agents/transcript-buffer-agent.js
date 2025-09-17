/**
 * Transcript Buffer Agent
 * 
 * Buffers incoming transcript chunks and outputs speaker-grouped turns
 * with sequential turn_index numbers for ordering.
 * 
 * Flush conditions:
 * 1. Speaker change detected
 * 2. Buffer exceeds maximum length
 * 3. Manual flush called (e.g., meeting end)
 */

export class TranscriptBufferAgent {
  constructor(options = {}) {
    this.maxLength = options.maxLength || 1000;
    this.onTurnReady = options.onTurnReady || null;
    
    // Buffer state
    this.buffer = '';
    this.currentSpeaker = null;
    this.meetingIndex = 0;
    this.meetingId = null;
    this.clientId = null;
  }

  /**
   * Initialize for a new meeting
   */
  startNewMeeting({ meetingId, clientId }) {
    this.meetingId = meetingId;
    this.clientId = clientId;
    this.meetingIndex = 0;
    this.buffer = '';
    this.currentSpeaker = null;
    
    console.log(`[TranscriptBuffer] Started new meeting: ${meetingId}`);
  }

  // Backward compatibility alias
  startNewBlock(options) {
    return this.startNewMeeting(options);
  }

  /**
   * Add a transcript chunk
   * @param {Object} chunk - Transcript chunk with speaker and text
   * @param {string} chunk.speaker - Speaker label from transcript
   * @param {string} chunk.text - Text content
   * @param {Date} chunk.timestamp - Optional timestamp
   */
  async addChunk({ speaker, text, timestamp }) {
    if (!this.meetingId) {
      throw new Error('Must call startNewBlock (now startNewMeeting) before adding chunks');
    }

    // Normalize speaker label (trim, lowercase for comparison)
    const normalizedSpeaker = speaker?.trim() || 'Unknown Speaker';
    
    // Check if we need to flush due to speaker change
    if (this.currentSpeaker && normalizedSpeaker !== this.currentSpeaker) {
      await this.flush();
      this.currentSpeaker = normalizedSpeaker;
    }
    
    // Set speaker if this is first chunk
    if (!this.currentSpeaker) {
      this.currentSpeaker = normalizedSpeaker;
    }
    
    // Check if adding would exceed length limit
    if (this.buffer.length > 0 && this.buffer.length + text.length > this.maxLength) {
      await this.flush();
      // Keep currentSpeaker - same speaker, just too long
    }
    
    // Add to buffer with space if needed
    if (this.buffer.length > 0 && !this.buffer.endsWith(' ') && !text.startsWith(' ')) {
      this.buffer += ' ';
    }
    this.buffer += text;
  }

  /**
   * Flush current buffer as a turn
   */
  async flush() {
    if (!this.buffer || !this.currentSpeaker) {
      return;
    }

    const turn = {
      meetingId: this.meetingId,
      clientId: this.clientId,
      speaker: this.currentSpeaker,
      content: this.buffer.trim(),
      meetingIndex: ++this.meetingIndex,
      timestamp: new Date(),
      metadata: {
        speaker_label: this.currentSpeaker,
        chunk_length: this.buffer.length
      }
    };

    console.log(`[TranscriptBuffer] Flushing turn ${this.meetingIndex} for speaker: ${this.currentSpeaker} (${turn.content.length} chars)`);
    
    // Call the callback if provided
    if (this.onTurnReady) {
      try {
        await this.onTurnReady(turn);
      } catch (error) {
        console.error('[TranscriptBuffer] Error in onTurnReady callback:', error);
        // Continue processing - don't let callback errors stop buffering
      }
    }
    
    // Clear buffer but keep speaker (unless explicitly changed)
    this.buffer = '';
    
    return turn;
  }

  /**
   * Force flush any remaining content and end the meeting
   */
  async endMeeting() {
    await this.flush();
    
    const summary = {
      meetingId: this.meetingId,
      totalTurns: this.meetingIndex,
      lastSpeaker: this.currentSpeaker
    };
    
    console.log(`[TranscriptBuffer] Ended meeting ${this.meetingId} with ${this.meetingIndex} turns`);
    
    // Reset state
    this.meetingId = null;
    this.clientId = null;
    this.meetingIndex = 0;
    this.currentSpeaker = null;
    
    return summary;
  }

  // Backward compatibility alias
  async endBlock() {
    return this.endMeeting();
  }

  /**
   * Get current buffer state (for debugging)
   */
  getState() {
    return {
      meetingId: this.meetingId,
      currentSpeaker: this.currentSpeaker,
      bufferLength: this.buffer.length,
      meetingIndex: this.meetingIndex,
      hasContent: this.buffer.length > 0
    };
  }
}

// Example usage:
/*
const buffer = new TranscriptBufferAgent({
  maxLength: 1000,
  onTurnReady: async (turn) => {
    // Send to embedding/storage agent
    await embeddingAgent.processTurn(turn);
  }
});

// Start a new meeting
buffer.startNewMeeting({ 
  meetingId: 'abc-123', 
  clientId: 6 
});

// Process chunks as they arrive
buffer.addChunk({ speaker: 'Ken', text: 'I think we should...' });
buffer.addChunk({ speaker: 'Ken', text: 'consider the options.' });
buffer.addChunk({ speaker: 'Sarah', text: 'That makes sense.' }); // Triggers flush

// End meeting
await buffer.endMeeting();
*/