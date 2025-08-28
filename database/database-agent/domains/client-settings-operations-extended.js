/**
 * Client Settings Operations Extended - Advanced operations and utilities
 * Temperature management, bulk operations, and initialization
 */

export class ClientSettingsOperationsExtended {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Set multiple client settings in a transaction
   * @param {number} clientId - Client ID
   * @param {Array} settings - Array of {key, value, type} objects
   * @param {number} userId - User ID making the changes
   * @returns {Array} Array of created/updated settings
   */
  async setClientSettings(clientId, settings, userId = null) {
    return await this.connector.transaction(async (client) => {
      const results = [];
      
      for (const setting of settings) {
        const { key, value, type = 'string' } = setting;
        
        const stringValue = this._stringifySettingValue(value, type);
        
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
        
        const result = await client.query(query, [
          clientId, key, stringValue, type, userId
        ]);
        
        const resultSetting = result.rows[0];
        results.push({
          ...resultSetting,
          parsed_value: this._parseSettingValue(resultSetting.setting_value, resultSetting.setting_type)
        });
      }
      
      return results;
    });
  }

  /**
   * Get client settings as a key-value object
   * @param {number} clientId - Client ID
   * @returns {Object} Settings as key-value pairs with parsed values
   */
  async getClientSettingsMap(clientId, coreOperations) {
    const settings = await coreOperations.getClientSettings(clientId);
    const settingsMap = {};
    
    for (const setting of settings) {
      settingsMap[setting.setting_key] = setting.parsed_value;
    }
    
    return settingsMap;
  }

  /**
   * Get temperature setting for a client with fallback
   * @param {number} clientId - Client ID
   * @param {number} fallback - Fallback value if not set (default: 0.7)
   * @returns {number} Temperature value
   */
  async getClientTemperature(clientId, fallback = 0.7, coreOperations) {
    const setting = await coreOperations.getClientSetting(clientId, 'temperature');
    return setting ? setting.parsed_value : fallback;
  }

  /**
   * Set temperature setting for a client
   * @param {number} clientId - Client ID
   * @param {number} temperature - Temperature value (0.0 - 1.0)
   * @param {number} userId - User ID making the change
   * @returns {Object} Updated setting
   */
  async setClientTemperature(clientId, temperature, userId = null, coreOperations) {
    // Validate temperature range
    if (typeof temperature !== 'number' || temperature < 0 || temperature > 1) {
      throw new Error('Temperature must be a number between 0 and 1');
    }
    
    return await coreOperations.setClientSetting(clientId, 'temperature', temperature, 'number', userId);
  }

  /**
   * Initialize default settings for a new client
   * @param {number} clientId - Client ID
   * @param {number} userId - User ID creating the defaults
   * @returns {Array} Array of created default settings
   */
  async initializeDefaultSettings(clientId, userId = null) {
    const defaultSettings = [
      { key: 'temperature', value: 0.7, type: 'number' },
      { key: 'max_tokens', value: 4000, type: 'number' },
      { key: 'enable_file_search', value: true, type: 'boolean' }
    ];
    
    return await this.setClientSettings(clientId, defaultSettings, userId);
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