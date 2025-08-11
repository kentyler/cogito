import express from 'express';
import { DatabaseAgent } from '../../lib/database-agent.js';
import { AdminClientOperations } from '../lib/admin-client-operations.js';
import { extractRequestContext } from '../lib/event-logger.js';

const router = express.Router();
const dbAgent = new DatabaseAgent();
const adminOps = new AdminClientOperations(dbAgent);

// Middleware to check if user is admin (ken@8thfold.com = user_id 1, ianpalonis@gmail.com = user_id 7)
const requireAdmin = (req, res, next) => {
  const adminUserIds = [1, 7]; // ken@8thfold.com and ianpalonis@gmail.com
  const userId = req.session?.user?.user_id;
  
  if (!userId || !adminUserIds.includes(userId)) {
    return res.status(403).json({ 
      error: 'Admin access required. This function is restricted to authorized administrators.' 
    });
  }
  next();
};

// Ensure database connection
router.use(async (req, res, next) => {
  try {
    if (!dbAgent.connector.pool) {
      await dbAgent.connect();
    }
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// GET /api/admin/clients - Get all clients with statistics
router.get('/clients', requireAdmin, async (req, res) => {
  try {
    const clients = await adminOps.getAllClients();
    res.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    
    // Log error
    const context = extractRequestContext(req);
    const eventLogger = dbAgent.getEventLogger();
    if (eventLogger) {
      await eventLogger.logError('admin_clients_fetch_failed', error, {
        ...context,
        severity: 'error',
        component: 'ClientManagement'
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/admin/clients/:id - Get specific client details
router.get('/clients/:id', requireAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const client = await adminOps.getClientDetails(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
});

// POST /api/admin/clients - Create new client
router.post('/clients', requireAdmin, async (req, res) => {
  try {
    const client = await adminOps.createClient(req.body, req);
    res.status(201).json({ client });
  } catch (error) {
    console.error('Error creating client:', error);
    
    // Log error
    const context = extractRequestContext(req);
    const eventLogger = dbAgent.getEventLogger();
    if (eventLogger) {
      await eventLogger.logError('admin_client_creation_failed', error, {
        ...context,
        client_name: req.body?.name,
        severity: 'error',
        component: 'ClientManagement'
      });
    }

    const statusCode = error.message === 'Client name is required' ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to create client' });
  }
});

// PUT /api/admin/clients/:id - Update client
router.put('/clients/:id', requireAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const client = await adminOps.updateClient(clientId, req.body);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Error updating client:', error);
    const statusCode = error.message === 'No updates provided' ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to update client' });
  }
});

// DELETE /api/admin/clients/:id - Delete client
router.delete('/clients/:id', requireAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const deletedClient = await adminOps.deleteClient(clientId, req);
    if (!deletedClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json({ 
      message: 'Client deleted successfully', 
      client: deletedClient 
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    
    // Log error
    const context = extractRequestContext(req);
    const eventLogger = dbAgent.getEventLogger();
    if (eventLogger) {
      await eventLogger.logError('admin_client_deletion_failed', error, {
        ...context,
        client_id: req.params.id,
        severity: 'error',
        component: 'ClientManagement'
      });
    }

    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;