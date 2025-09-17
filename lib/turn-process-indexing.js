/**
 * Turn Indexing Processor - Calculate turn_index for insertable ordering
 * 
 * Handles:
 * - Insertion between existing messages using fractional indices
 * - Appending new messages at the end
 * - Timestamp-based indexing for chronological order
 * - Database helper function integration
 */

export class TurnIndexingProcessor {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }

  /**
   * Calculate turn index for proper ordering/insertion
   * @param {Object} turnData - Turn data with insertion requirements
   * @returns {Promise<number>} Calculated turn_index as float
   */
  async calculateTurnIndex(turnData) {
    try {
      // If turn_index explicitly provided, validate and use it
      if (turnData.turn_index !== undefined) {
        const validatedIndex = this._validateExplicitIndex(turnData.turn_index);
        
        await this.dbAgent.logEvent('turn_index_explicit', {
          provided_index: turnData.turn_index,
          validated_index: validatedIndex,
          client_id: turnData.client_id
        }, {
          component: 'TurnIndexingProcessor',
          severity: 'info'
        });
        
        return validatedIndex;
      }

      // If insertAfter specified, calculate between two turns
      if (turnData.insertAfter !== undefined) {
        return await this._calculateInsertionIndex(turnData.insertAfter, turnData.insertBefore, turnData.client_id);
      }

      // Default: append at end using timestamp
      const timestampIndex = this._timestampToIndex(turnData.timestamp || new Date());
      
      await this.dbAgent.logEvent('turn_index_timestamp', {
        timestamp_index: timestampIndex,
        client_id: turnData.client_id
      }, {
        component: 'TurnIndexingProcessor',
        severity: 'info'
      });
      
      return timestampIndex;
    } catch (error) {
      // Log indexing error and fallback to timestamp
      await this.dbAgent.logError('turn_index_calculation_failed', error, {
        component: 'TurnIndexingProcessor',
        client_id: turnData.client_id,
        insertAfter: turnData.insertAfter,
        insertBefore: turnData.insertBefore,
        severity: 'error'
      });

      // Fallback to timestamp-based index
      return this._timestampToIndex(new Date());
    }
  }

  /**
   * Calculate index for inserting between two existing turns
   * @private
   */
  async _calculateInsertionIndex(afterTurnId, beforeTurnId = null, clientId) {
    try {
      let afterIndex = null;
      let beforeIndex = null;

      // Get the turn_index of the reference turns
      if (afterTurnId) {
        const afterTurn = await this._getTurnIndexById(afterTurnId);
        afterIndex = afterTurn?.turn_index;
        
        if (!afterIndex) {
          throw new Error(`Turn ${afterTurnId} not found or has no turn_index`);
        }
      }

      if (beforeTurnId) {
        const beforeTurn = await this._getTurnIndexById(beforeTurnId);
        beforeIndex = beforeTurn?.turn_index;
        
        if (!beforeIndex) {
          throw new Error(`Turn ${beforeTurnId} not found or has no turn_index`);
        }
      }

      // Use database helper function
      const query = 'SELECT meetings.calculate_insertion_index($1, $2) as index';
      const result = await this.dbAgent.connector.query(query, [afterIndex, beforeIndex]);
      const calculatedIndex = result.rows[0].index;

      // Log successful insertion calculation
      await this.dbAgent.logEvent('turn_index_insertion_calculated', {
        after_turn_id: afterTurnId,
        before_turn_id: beforeTurnId,
        after_index: afterIndex,
        before_index: beforeIndex,
        calculated_index: calculatedIndex,
        client_id: clientId
      }, {
        component: 'TurnIndexingProcessor',
        severity: 'info'
      });

      return calculatedIndex;
    } catch (error) {
      // Log insertion calculation error
      await this.dbAgent.logError('turn_index_insertion_failed', error, {
        component: 'TurnIndexingProcessor',
        after_turn_id: afterTurnId,
        before_turn_id: beforeTurnId,
        client_id: clientId,
        severity: 'error'
      });
      
      throw error; // Re-throw to be caught by main calculation method
    }
  }

  /**
   * Get turn_index for a specific turn ID
   * @private
   */
  async _getTurnIndexById(turnId) {
    try {
      const result = await this.dbAgent.connector.query(
        'SELECT turn_index FROM meetings.turns WHERE id = $1',
        [turnId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      await this.dbAgent.logError('turn_index_lookup_failed', error, {
        component: 'TurnIndexingProcessor',
        turn_id: turnId,
        severity: 'warning'
      });
      
      return null;
    }
  }

  /**
   * Convert timestamp to float index for ordering
   * @private
   */
  _timestampToIndex(timestamp) {
    // Convert to Unix timestamp (seconds since epoch) as float
    const epochSeconds = Date.parse(timestamp) / 1000;
    
    // Validate the result
    if (isNaN(epochSeconds) || epochSeconds < 0) {
      console.warn('Invalid timestamp for indexing, using current time');
      return Date.now() / 1000;
    }
    
    return epochSeconds;
  }

  /**
   * Validate explicitly provided turn_index
   * @private
   */
  _validateExplicitIndex(index) {
    // Convert to number if string
    const numIndex = typeof index === 'string' ? parseFloat(index) : index;
    
    if (isNaN(numIndex) || !isFinite(numIndex)) {
      throw new Error(`Invalid turn_index: ${index} - must be a finite number`);
    }
    
    if (numIndex < 0) {
      throw new Error(`Invalid turn_index: ${numIndex} - must be non-negative`);
    }
    
    return numIndex;
  }

  /**
   * Get next available index after the latest turn for a client
   * @param {number} clientId - Client ID
   * @returns {Promise<number>} Next available index
   */
  async getNextAvailableIndex(clientId) {
    try {
      const result = await this.dbAgent.connector.query(`
        SELECT COALESCE(MAX(turn_index), 0) + 1 as next_index
        FROM meetings.turns 
        WHERE client_id = $1
      `, [clientId]);
      
      const nextIndex = result.rows[0].next_index;
      
      await this.dbAgent.logEvent('turn_index_next_available', {
        client_id: clientId,
        next_index: nextIndex
      }, {
        component: 'TurnIndexingProcessor',
        severity: 'info'
      });
      
      return nextIndex;
    } catch (error) {
      await this.dbAgent.logError('turn_index_next_available_failed', error, {
        component: 'TurnIndexingProcessor',
        client_id: clientId,
        severity: 'error'
      });
      
      // Fallback to timestamp
      return this._timestampToIndex(new Date());
    }
  }

  /**
   * Validate turn index doesn't create conflicts
   * @param {number} turnIndex - Index to validate
   * @param {number} clientId - Client ID
   * @returns {Promise<boolean>} True if index is available
   */
  async validateIndexAvailability(turnIndex, clientId) {
    try {
      const result = await this.dbAgent.connector.query(`
        SELECT COUNT(*) as count
        FROM meetings.turns 
        WHERE client_id = $1 AND turn_index = $2
      `, [clientId, turnIndex]);
      
      const isAvailable = parseInt(result.rows[0].count) === 0;
      
      if (!isAvailable) {
        await this.dbAgent.logEvent('turn_index_conflict_detected', {
          client_id: clientId,
          conflicting_index: turnIndex
        }, {
          component: 'TurnIndexingProcessor',
          severity: 'warning'
        });
      }
      
      return isAvailable;
    } catch (error) {
      await this.dbAgent.logError('turn_index_availability_check_failed', error, {
        component: 'TurnIndexingProcessor',
        client_id: clientId,
        turn_index: turnIndex,
        severity: 'error'
      });
      
      return false; // Assume not available on error
    }
  }
}