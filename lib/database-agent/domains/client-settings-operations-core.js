/**
 * Client Settings Operations Core - Basic CRUD operations
 * Core functionality for managing client-specific configuration settings
 */

export class ClientSettingsOperationsCore {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get a specific setting for a client
   * @param {number} clientId - Client ID
   * @param {string} settingKey - Setting key (e.g., 'temperature')
   * @returns {Object|null} Setting object or null if not found
   */
  async getClientSetting(clientId, settingKey) {
    const query = `
      SELECT id, client_id, setting_key, setting_value, setting_type, 
             created_at, updated_at, created_by_user_id
      FROM client_mgmt.client_settings
      WHERE client_id = $1 AND setting_key = $2
    `;
    
    const result = await this.connector.query(query, [clientId, settingKey]);
    if (result.rows.length === 0) {
      return null;
    }
    
    const setting = result.rows[0];
    return {
      ...setting,
      parsed_value: this._parseSettingValue(setting.setting_value, setting.setting_type)
    };
  }

  /**
   * Get all settings for a client
   * @param {number} clientId - Client ID
   * @returns {Array} Array of setting objects
   */
  async getClientSettings(clientId) {
    const query = `
      SELECT id, client_id, setting_key, setting_value, setting_type,
             created_at, updated_at, created_by_user_id
      FROM client_mgmt.client_settings
      WHERE client_id = $1
      ORDER BY setting_key
    `;
    
    const result = await this.connector.query(query, [clientId]);
    return result.rows.map(setting => ({
      ...setting,
      parsed_value: this._parseSettingValue(setting.setting_value, setting.setting_type)
    }));
  }

  /**
   * Set a client setting (create or update)
   * @param {number} clientId - Client ID
   * @param {string} settingKey - Setting key
   * @param {any} settingValue - Setting value
   * @param {string} settingType - Setting type ('string', 'number', 'boolean', 'json')
   * @param {number} userId - User ID who is making the change
   * @returns {Object} Created or updated setting
   */
  async setClientSetting(clientId, settingKey, settingValue, settingType = 'string', userId = null) {
    // Validate setting type
    const validTypes = ['string', 'number', 'boolean', 'json'];
    if (!validTypes.includes(settingType)) {
      throw new Error(`Invalid setting type: ${settingType}. Must be one of: ${validTypes.join(', ')}`);
    }

    // Convert value to string for storage
    const stringValue = this._stringifySettingValue(settingValue, settingType);
    
    const query = `
      INSERT INTO client_mgmt.client_settings 
      (client_id, setting_key, setting_value, setting_type, created_by_user_id, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (client_id, setting_key)
      DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        setting_type = EXCLUDED.setting_type,
        updated_at = NOW(),
        created_by_user_id = COALESCE(EXCLUDED.created_by_user_id, client_settings.created_by_user_id)
      RETURNING id, client_id, setting_key, setting_value, setting_type,
                created_at, updated_at, created_by_user_id
    `;
    
    const result = await this.connector.query(query, [
      clientId, settingKey, stringValue, settingType, userId
    ]);
    
    const setting = result.rows[0];
    return {
      ...setting,
      parsed_value: this._parseSettingValue(setting.setting_value, setting.setting_type)
    };
  }

  /**
   * Delete a client setting
   * @param {number} clientId - Client ID
   * @param {string} settingKey - Setting key to delete
   * @returns {boolean} True if setting was deleted, false if not found
   */
  async deleteClientSetting(clientId, settingKey) {
    const query = `
      DELETE FROM client_mgmt.client_settings
      WHERE client_id = $1 AND setting_key = $2
    `;
    
    const result = await this.connector.query(query, [clientId, settingKey]);
    return result.rowCount > 0;
  }

  /**
   * Parse setting value based on type
   * @private
   */
  _parseSettingValue(value, type) {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        return JSON.parse(value);
      case 'string':
      default:
        return value;
    }
  }

  /**
   * Convert setting value to string for storage
   * @private
   */
  _stringifySettingValue(value, type) {
    switch (type) {
      case 'number':
      case 'boolean':
        return String(value);
      case 'json':
        return JSON.stringify(value);
      case 'string':
      default:
        return String(value);
    }
  }
}