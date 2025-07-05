// Node.js Database Handler for Cogito UI
const { Client } = require('pg');
const readline = require('readline');

// Force IPv4 to avoid IPv6 connectivity issues
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// Database configuration - using Supabase
const supabaseUrl = 'postgresql://user:password@host/database';

const dbConfig = {
  connectionString: supabaseUrl,
  ssl: { rejectUnauthorized: false },
  // Add connection pool settings for better stability
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // Keep connection alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

let client;
let pendingEmail = null;
let pendingUser = null;
let currentUser = null;
let isConnecting = false;
let connectionAttempts = 0;
let maxConnectionAttempts = 5;

// Initialize database connection
async function initConnection() {
  if (isConnecting) {
    console.log('Connection already in progress, skipping...');
    return;
  }
  
  isConnecting = true;
  let retryCount = 0;
  const maxRetries = 3;
  
  try {
    while (retryCount < maxRetries) {
      try {
        // Close existing connection if it exists
        if (client && !client.ended) {
          try {
            await client.end();
          } catch (e) {
            // Ignore errors when closing
          }
        }
        
        client = new Client(dbConfig);
        
        // Add error handler with connection attempt tracking
        client.on('error', (err) => {
          console.error('Database connection error:', err.message);
          connectionAttempts++;
          
          // Only attempt reconnection if we haven't exceeded max attempts
          if (connectionAttempts < maxConnectionAttempts && !isConnecting) {
            setTimeout(() => {
              console.log(`Attempting to reconnect... (${connectionAttempts}/${maxConnectionAttempts})`);
              initConnection().catch(reconnectErr => {
                console.error('Reconnection failed:', reconnectErr.message);
              });
            }, Math.min(5000 * connectionAttempts, 30000)); // Exponential backoff with max 30s
          } else if (connectionAttempts >= maxConnectionAttempts) {
            console.error('Max connection attempts reached. Stopping reconnection attempts.');
          }
        });
        
        await client.connect();
        console.log('CONNECTION_READY');
        connectionAttempts = 0; // Reset counter on successful connection
        return; // Success, exit the retry loop
      } catch (err) {
        retryCount++;
        console.error(`Connection attempt ${retryCount} failed: ${err.message}`);
        
        if (retryCount >= maxRetries) {
          console.log(JSON.stringify({
            error: `Database connection failed after ${maxRetries} attempts: ${err.message}`
          }));
          process.exit(1);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } finally {
    isConnecting = false;
  }
}

// Check if database connection is alive
async function ensureConnection() {
  if (!client || client.ended || isConnecting) {
    if (!isConnecting) {
      console.log('Connection lost, attempting to reconnect...');
      await initConnection();
    } else {
      // Wait for existing connection attempt to complete
      while (isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}

// Check if email exists
async function checkEmail(email) {
  try {
    await ensureConnection();
    const query = 'SELECT id, email, password_hash FROM client_mgmt.users WHERE email = $1 LIMIT 1';
    const result = await client.query(query, [email]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(JSON.stringify({
        found: true,
        id: user.id,
        display_name: user.email.split('@')[0], // Use email prefix as display name
        hasPassword: !!user.password_hash
      }));
    } else {
      console.log(JSON.stringify({
        found: false,
        requestLink: 'https://cogito.example.com/request-access'
      }));
    }
  } catch (err) {
    console.log(JSON.stringify({
      error: err.message
    }));
  }
}

// Verify password and get full session data
async function verifyPassword(password) {
  try {
    await ensureConnection();
    // Using crypt for password verification and get all client memberships
    const authQuery = `
      SELECT u.id, u.email, u.client_id, c.name as client_name, c.id as client_id_full
      FROM client_mgmt.users u
      JOIN client_mgmt.clients c ON u.client_id = c.id
      WHERE u.email = $1 AND u.password_hash = crypt($2, u.password_hash) 
      ORDER BY c.name
    `;
    const authResult = await client.query(authQuery, [pendingEmail, password]);
    
    if (authResult.rows.length > 0) {
      // If user has multiple client memberships, present choice
      if (authResult.rows.length > 1) {
        const clientChoices = authResult.rows.map(row => ({
          client_id: row.client_id,
          client_name: row.client_name
        }));
        
        // Store user info for client selection
        pendingUser = {
          id: authResult.rows[0].id,
          email: authResult.rows[0].email,
          display_name: authResult.rows[0].email.split('@')[0]
        };
        
        console.log(JSON.stringify({
          authenticated: true,
          needs_client_selection: true,
          user: pendingUser,
          client_choices: clientChoices
        }));
        return;
      }
      
      // Single client membership, proceed normally
      const user = authResult.rows[0];
      
      // Get all users in this client for broader context
      const clientUsersQuery = `
        SELECT id, email 
        FROM client_mgmt.users 
        WHERE client_id = $1 AND is_active = true
      `;
      const clientUsers = await client.query(clientUsersQuery, [user.client_id]);
      const userIds = clientUsers.rows.map(u => u.id);
      
      // Get activity count for this client
      const activityCountQuery = `
        SELECT COUNT(*) as total_turns
        FROM conversation.turns 
        WHERE client_id = $1
      `;
      const countResult = await client.query(activityCountQuery, [user.client_id]);
      
      const sessionData = {
        authenticated: true,
        user: {
          id: user.id,
          display_name: user.email.split('@')[0],
          email: user.email,
          client_id: user.client_id,
          client_name: user.client_name
        },
        client_users: clientUsers.rows,
        total_interactions: countResult.rows[0]?.total_turns || 0,
        activity_summary: `Client ${user.client_name} has ${countResult.rows[0]?.total_turns || 0} total interactions across ${clientUsers.rows.length} users`
      };
      
      console.log(JSON.stringify(sessionData));
    } else {
      console.log(JSON.stringify({
        authenticated: false,
        error: 'Invalid password'
      }));
    }
  } catch (err) {
    console.log(JSON.stringify({
      error: err.message
    }));
  }
}

// Handle client selection and load session data
async function selectClient(clientId) {
  try {
    await ensureConnection();
    if (!pendingUser) {
      console.log(JSON.stringify({ error: "No pending user for client selection" }));
      return;
    }

    // Get client info
    const clientQuery = `
      SELECT name FROM client_mgmt.clients WHERE id = $1
    `;
    const clientResult = await client.query(clientQuery, [clientId]);
    
    if (clientResult.rows.length === 0) {
      console.log(JSON.stringify({ error: "Invalid client ID" }));
      return;
    }

    const clientName = clientResult.rows[0].name;

    // Get all users in this client
    const clientUsersQuery = `
      SELECT id, email 
      FROM client_mgmt.users 
      WHERE client_id = $1 AND is_active = true
    `;
    const clientUsers = await client.query(clientUsersQuery, [clientId]);
    const userIds = clientUsers.rows.map(u => u.id);
    
    // Get activity count for this client
    const activityCountQuery = `
      SELECT COUNT(*) as total_turns
      FROM conversation.turns 
      WHERE client_id = $1
    `;
    const countResult = await client.query(activityCountQuery, [clientId]);

    // Get client story
    const clientStoryQuery = `
      SELECT story, name as client_name
      FROM client_mgmt.clients 
      WHERE id = $1
    `;
    const storyResult = await client.query(clientStoryQuery, [clientId]);

    const sessionData = {
      client_selected: true,
      user: {
        ...pendingUser,
        client_id: clientId,
        client_name: clientName
      },
      client_users: clientUsers.rows,
      total_interactions: countResult.rows[0]?.total_turns || 0,
      client_story: storyResult.rows[0]?.story || 'No story available yet.'
    };
    
    // Store current user and clear pending user
    currentUser = sessionData.user;
    pendingUser = null;
    
    console.log(JSON.stringify(sessionData));
  } catch (err) {
    console.log(JSON.stringify({
      error: err.message
    }));
  }
}

// Switch to a different client for an authenticated user
async function switchClient(clientId) {
  try {
    await ensureConnection();
    if (!currentUser) {
      console.log(JSON.stringify({ error: "No authenticated user for client switching" }));
      return;
    }

    // Get client info
    const clientQuery = `
      SELECT name FROM client_mgmt.clients WHERE id = $1
    `;
    const clientResult = await client.query(clientQuery, [clientId]);
    
    if (clientResult.rows.length === 0) {
      console.log(JSON.stringify({ error: "Invalid client ID" }));
      return;
    }

    const clientName = clientResult.rows[0].name;

    // Get all users in this client
    const clientUsersQuery = `
      SELECT id, email 
      FROM client_mgmt.users 
      WHERE client_id = $1 AND is_active = true
    `;
    const clientUsers = await client.query(clientUsersQuery, [clientId]);
    
    // Get activity count for this client
    const activityCountQuery = `
      SELECT COUNT(*) as total_turns
      FROM conversation.turns 
      WHERE client_id = $1
    `;
    const countResult = await client.query(activityCountQuery, [clientId]);

    // Get client story
    const clientStoryQuery = `
      SELECT story, name as client_name
      FROM client_mgmt.clients 
      WHERE id = $1
    `;
    const storyResult = await client.query(clientStoryQuery, [clientId]);

    const sessionData = {
      client_selected: true,
      user: {
        ...currentUser,
        client_id: clientId,
        client_name: clientName
      },
      client_users: clientUsers.rows,
      total_interactions: countResult.rows[0]?.total_turns || 0,
      client_story: storyResult.rows[0]?.story || 'No story available yet.'
    };
    
    // Update current user with new client info
    currentUser = sessionData.user;
    
    console.log(JSON.stringify(sessionData));
  } catch (err) {
    console.log(JSON.stringify({
      error: err.message
    }));
  }
}

// Handle file upload
async function uploadFile(fileData) {
  try {
    await ensureConnection();
    const { filename, fileSize, mimeType, clientId, description, content } = fileData;
    
    // Generate storage path
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const storagePath = `uploads/${timestamp}-${safeName}`;
    
    // Create file upload record
    const result = await client.query(`
      INSERT INTO files.file_uploads 
      (filename, mime_type, file_path, file_size, public_url, bucket_name, description, tags, client_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [
      filename,
      mimeType,
      storagePath,
      fileSize,
      null, // public_url - we're not using storage for now
      'local', // bucket_name
      description,
      null, // tags
      clientId
    ]);

    const fileRecord = result.rows[0];
    
    // If it's a text file, also chunk and store for search
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      // Decode base64 content
      const textContent = Buffer.from(content, 'base64').toString('utf8');
      
      // Simple chunking (1000 chars with 200 char overlap)
      const chunks = chunkText(textContent, 1000, 200);
      
      // Store chunks (without embeddings for now - that would require OpenAI integration)
      for (let i = 0; i < chunks.length; i++) {
        await client.query(`
          INSERT INTO files.file_upload_vectors 
          (file_upload_id, chunk_index, content_text, content_vector, client_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          fileRecord.id,
          i,
          chunks[i],
          null, // no vector for now
          clientId
        ]);
      }
    }

    console.log(JSON.stringify({
      file_uploaded: true,
      file: fileRecord,
      chunks_created: mimeType.startsWith('text/') ? 'yes' : 'no'
    }));
  } catch (err) {
    console.log(JSON.stringify({
      error: `File upload failed: ${err.message}`
    }));
  }
}

// Simple text chunking function
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
    
    start = end - overlap;
    if (start <= 0) start = end;
  }
  
  return chunks;
}

// Execute query
async function executeQuery(query) {
  try {
    const result = await client.query(query);
    console.log(JSON.stringify(result.rows));
  } catch (err) {
    console.log(JSON.stringify({
      error: err.message
    }));
  }
}

// Main command loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Initialize connection
initConnection();

// Process commands
rl.on('line', async (line) => {
  const command = line.trim();
  
  if (command.startsWith('CHECK_EMAIL:')) {
    const email = command.substring(12);
    pendingEmail = email;
    await checkEmail(email);
  } else if (command.startsWith('VERIFY_PASSWORD:')) {
    const password = command.substring(16);
    await verifyPassword(password);
  } else if (command.startsWith('SELECT_CLIENT:')) {
    const clientId = command.substring(14);
    await selectClient(parseInt(clientId));
  } else if (command.startsWith('SWITCH_CLIENT:')) {
    const clientId = command.substring(14);
    await switchClient(parseInt(clientId));
  } else if (command.startsWith('UPLOAD_FILE:')) {
    const fileData = JSON.parse(command.substring(12));
    await uploadFile(fileData);
  } else if (command.startsWith('QUERY:')) {
    const query = command.substring(6);
    await executeQuery(query);
  } else if (command === 'EXIT') {
    if (client) {
      await client.end();
    }
    process.exit(0);
  } else {
    console.log('UNKNOWN_COMMAND');
  }
});

// Handle shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.end();
  }
  process.exit(0);
});