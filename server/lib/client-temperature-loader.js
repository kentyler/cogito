/**
 * Client Temperature Loader
 * Handles loading client-specific temperature settings
 */

export async function loadClientTemperature(userClientId) {
  if (!userClientId) {
    return null;
  }
  
  try {
    const { DatabaseAgent } = await import('../../lib/database-agent.js');
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    const tempSetting = await dbAgent.clientSettings.getClientSetting(userClientId, 'temperature');
    await dbAgent.close();
    
    if (tempSetting && tempSetting.parsed_value !== undefined) {
      console.log(`🌡️ Using client temperature setting: ${tempSetting.parsed_value} for client ${userClientId}`);
      return tempSetting.parsed_value;
    }
    
    return null;
  } catch (tempError) {
    console.warn('Failed to load client temperature setting:', tempError);
    return null;
  }
}