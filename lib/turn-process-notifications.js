/**
 * Turn Notifications Processor - Handle @mention notifications
 * 
 * Handles:
 * - Creating notification records for @mentioned users
 * - Managing notification states (unread/read)
 * - Notification cleanup and maintenance
 * - Integration with addressing processor
 */

export class TurnNotificationsProcessor {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }

  /**
   * Create notifications for @mentioned users in a turn
   * @param {Object} createdTurn - Turn that was created
   * @param {Array} mentions - Array of mention strings
   * @param {number} clientId - Client ID for context
   * @returns {Promise<Array>} Array of created notification IDs
   */
  async createNotifications(createdTurn, mentions, clientId) {
    if (!mentions || mentions.length === 0) {
      return [];
    }

    try {
      // First ensure notifications table exists
      await this._ensureNotificationsTable();

      // Resolve mentions to user IDs (this should be done by addressing processor)
      const userIds = await this._resolveMentionsToUserIds(mentions);
      
      if (userIds.length === 0) {
        await this.dbAgent.logEvent('turn_notifications_no_valid_users', {
          turn_id: createdTurn.id,
          mentions,
          client_id: clientId
        }, {
          component: 'TurnNotificationsProcessor',
          severity: 'info'
        });
        return [];
      }

      // Create notification records
      const notificationIds = [];
      for (const userId of userIds) {
        try {
          const notificationId = await this._createNotificationRecord(createdTurn, userId, clientId);
          if (notificationId) {
            notificationIds.push(notificationId);
          }
        } catch (error) {
          // Log individual notification failure but continue with others
          await this.dbAgent.logError('turn_notification_creation_failed', error, {
            component: 'TurnNotificationsProcessor',
            turn_id: createdTurn.id,
            user_id: userId,
            client_id: clientId,
            severity: 'warning'
          });
        }
      }

      // Log successful notification creation
      if (notificationIds.length > 0) {
        await this.dbAgent.logEvent('turn_notifications_created', {
          turn_id: createdTurn.id,
          notifications_created: notificationIds.length,
          user_count: userIds.length,
          mentions,
          client_id: clientId
        }, {
          component: 'TurnNotificationsProcessor',
          severity: 'info'
        });
      }

      return notificationIds;
    } catch (error) {
      // Log general notification process failure
      await this.dbAgent.logError('turn_notifications_process_failed', error, {
        component: 'TurnNotificationsProcessor',
        turn_id: createdTurn?.id,
        mentions_count: mentions?.length || 0,
        client_id: clientId,
        severity: 'error'
      });

      return [];
    }
  }

  /**
   * Ensure notifications table exists (create if needed)
   * @private
   */
  async _ensureNotificationsTable() {
    try {
      // Check if table exists
      const tableExists = await this.dbAgent.connector.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'conversation' 
          AND table_name = 'notifications'
        );
      `);

      if (!tableExists.rows[0].exists) {
        // Create notifications table
        await this.dbAgent.connector.query(`
          CREATE SCHEMA IF NOT EXISTS conversation;
          
          CREATE TABLE conversation.notifications (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT REFERENCES client_mgmt.users(id),
            turn_id BIGINT REFERENCES meetings.turns(id),
            client_id BIGINT,
            created_at TIMESTAMP DEFAULT NOW(),
            read_at TIMESTAMP NULL,
            metadata JSONB DEFAULT '{}'::jsonb
          );

          CREATE INDEX idx_notifications_user_unread 
          ON conversation.notifications(user_id, created_at) 
          WHERE read_at IS NULL;

          CREATE INDEX idx_notifications_turn 
          ON conversation.notifications(turn_id);
        `);

        await this.dbAgent.logEvent('notifications_table_created', {
          created_at: new Date().toISOString()
        }, {
          component: 'TurnNotificationsProcessor',
          severity: 'info'
        });
      }
    } catch (error) {
      await this.dbAgent.logError('notifications_table_creation_failed', error, {
        component: 'TurnNotificationsProcessor',
        severity: 'error'
      });
      throw error;
    }
  }

  /**
   * Create individual notification record
   * @private
   */
  async _createNotificationRecord(turn, userId, clientId) {
    try {
      const result = await this.dbAgent.connector.query(`
        INSERT INTO conversation.notifications (user_id, turn_id, client_id, created_at, metadata)
        VALUES ($1, $2, $3, NOW(), $4)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        userId,
        turn.id,
        clientId,
        {
          turn_content_preview: turn.content?.substring(0, 100) || '',
          source_type: turn.source_type || 'unknown',
          created_by_user_id: turn.user_id
        }
      ]);

      return result.rows[0]?.id || null;
    } catch (error) {
      // Error will be handled by caller
      throw error;
    }
  }

  /**
   * Resolve mentions to user IDs (similar to addressing processor)
   * @private
   */
  async _resolveMentionsToUserIds(mentions) {
    const userIds = [];

    for (const mention of mentions) {
      // Skip Cogito mentions
      if (mention.toLowerCase() === 'cogito') continue;

      try {
        const result = await this.dbAgent.connector.query(`
          SELECT id FROM client_mgmt.users 
          WHERE LOWER(display_name) = LOWER($1)
          LIMIT 1
        `, [mention]);

        if (result.rows.length > 0) {
          userIds.push(result.rows[0].id);
        }
      } catch (error) {
        // Individual mention resolution failure - log but continue
        await this.dbAgent.logError('notification_mention_resolution_failed', error, {
          component: 'TurnNotificationsProcessor',
          mention,
          severity: 'warning'
        });
      }
    }

    return userIds;
  }

  /**
   * Get unread notifications for a user
   * @param {number} userId - User ID
   * @param {number} limit - Maximum notifications to return
   * @returns {Promise<Array>} Array of unread notifications
   */
  async getUnreadNotifications(userId, limit = 50) {
    try {
      const result = await this.dbAgent.connector.query(`
        SELECT 
          n.id,
          n.turn_id,
          n.client_id,
          n.created_at,
          n.metadata,
          t.content as turn_content,
          t.source_type,
          u.display_name as created_by_user
        FROM conversation.notifications n
        JOIN meetings.turns t ON n.turn_id = t.id
        LEFT JOIN client_mgmt.users u ON t.user_id = u.id
        WHERE n.user_id = $1 AND n.read_at IS NULL
        ORDER BY n.created_at DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows;
    } catch (error) {
      await this.dbAgent.logError('get_unread_notifications_failed', error, {
        component: 'TurnNotificationsProcessor',
        user_id: userId,
        severity: 'error'
      });
      return [];
    }
  }

  /**
   * Mark notifications as read
   * @param {Array} notificationIds - Array of notification IDs to mark as read
   * @param {number} userId - User ID (for security check)
   * @returns {Promise<number>} Number of notifications marked as read
   */
  async markNotificationsAsRead(notificationIds, userId) {
    if (!notificationIds || notificationIds.length === 0) return 0;

    try {
      const result = await this.dbAgent.connector.query(`
        UPDATE conversation.notifications 
        SET read_at = NOW()
        WHERE id = ANY($1) AND user_id = $2 AND read_at IS NULL
        RETURNING id
      `, [notificationIds, userId]);

      const markedCount = result.rows.length;

      if (markedCount > 0) {
        await this.dbAgent.logEvent('notifications_marked_read', {
          user_id: userId,
          notifications_marked: markedCount,
          notification_ids: result.rows.map(r => r.id)
        }, {
          component: 'TurnNotificationsProcessor',
          severity: 'info'
        });
      }

      return markedCount;
    } catch (error) {
      await this.dbAgent.logError('mark_notifications_read_failed', error, {
        component: 'TurnNotificationsProcessor',
        user_id: userId,
        notification_count: notificationIds.length,
        severity: 'error'
      });
      return 0;
    }
  }

  /**
   * Clean up old read notifications
   * @param {number} daysOld - Remove notifications older than this many days
   * @returns {Promise<number>} Number of notifications cleaned up
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const result = await this.dbAgent.connector.query(`
        DELETE FROM conversation.notifications
        WHERE read_at IS NOT NULL 
          AND read_at < NOW() - INTERVAL '${daysOld} days'
        RETURNING id
      `);

      const cleanedCount = result.rows.length;

      if (cleanedCount > 0) {
        await this.dbAgent.logEvent('notifications_cleanup_completed', {
          notifications_removed: cleanedCount,
          days_old: daysOld
        }, {
          component: 'TurnNotificationsProcessor',
          severity: 'info'
        });
      }

      return cleanedCount;
    } catch (error) {
      await this.dbAgent.logError('notifications_cleanup_failed', error, {
        component: 'TurnNotificationsProcessor',
        days_old: daysOld,
        severity: 'error'
      });
      return 0;
    }
  }
}