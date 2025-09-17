import { DatabaseAgent } from './database/database-agent.js';

async function checkLLMs() {
  const db = new DatabaseAgent();
  await db.connect();
  
  console.log('\n=== Checking LLMs table ===');
  const llms = await db.connector.query('SELECT id, provider, api_key FROM client_mgmt.llms ORDER BY provider');
  console.log('LLMs:', llms.rows);
  
  console.log('\n=== Checking LLM Models table ===');
  const models = await db.connector.query('SELECT id, name, model_id, llm_id, is_active FROM client_mgmt.llm_models WHERE is_active = true ORDER BY llm_id, name');
  console.log('Models:', models.rows);
  
  console.log('\n=== Testing getAvailableModels ===');
  const availableModels = await db.llms.getAvailableModels();
  console.log('Available models from function:', availableModels);
  
  await db.close();
}

checkLLMs().catch(console.error);
