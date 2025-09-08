import express from 'express';
import { DatabaseAgent } from '#database/database-agent.js';
import { AdminClientOperations } from '#server/clients/admin-client-operations.js';
import { requireAdmin, ensureDbConnection } from '../middleware/admin-auth.js';
import { createUserManagementRoutes } from './admin-user-management.js';
import { ApiResponses } from '../api/api-responses.js';

const router = express.Router();
const dbAgent = new DatabaseAgent();
const adminOps = new AdminClientOperations(dbAgent);

// Apply middleware
router.use(ensureDbConnection(dbAgent));

// Mount user management routes
router.use(createUserManagementRoutes(dbAgent));

// GET /api/admin/clients - Get all clients with statistics
router.get('/clients', requireAdmin, async (req, res) => {
  try {
    const clients = await adminOps.getAllClients();
    return ApiResponses.success(res, clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    
    // Log error
    await dbAgent.logError('admin_clients_fetch_failed', error, {
      userId: req.session?.user?.user_id || req.session?.user?.id,
      sessionId: req.sessionID,
      endpoint: `${req.method} ${req.path}`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      severity: 'error',
      component: 'ClientManagement'
    });
    
    return ApiResponses.error(res, 500, 'Failed to fetch clients');
  }
});

// GET /api/admin/clients/:id - Get specific client details
router.get('/clients/:id', requireAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return ApiResponses.error(res, 400, 'Invalid client ID');
    }

    const client = await adminOps.getClientDetails(clientId);
    if (!client) {
      return ApiResponses.error(res, 404, 'Client not found');
    }

    return ApiResponses.success(res, { client });
  } catch (error) {
    console.error('Error fetching client:', error);
    return ApiResponses.error(res, 500, 'Failed to fetch client details');
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
    await dbAgent.logError('admin_client_creation_failed', error, {
      userId: req.session?.user?.user_id || req.session?.user?.id,
      sessionId: req.sessionID,
      endpoint: `${req.method} ${req.path}`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      client_name: req.body?.name,
      severity: 'error',
      component: 'ClientManagement'
    });

    const statusCode = error.message === 'Client name is required' ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to create client' });
  }
});

// PUT /api/admin/clients/:id - Update client
router.put('/clients/:id', requireAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return ApiResponses.error(res, 400, 'Invalid client ID');
    }

    const client = await adminOps.updateClient(clientId, req.body);
    if (!client) {
      return ApiResponses.error(res, 404, 'Client not found');
    }

    return ApiResponses.success(res, { client });
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
      return ApiResponses.error(res, 400, 'Invalid client ID');
    }

    const deletedClient = await adminOps.deleteClient(clientId, req);
    if (!deletedClient) {
      return ApiResponses.error(res, 404, 'Client not found');
    }
    
    res.json({ 
      message: 'Client deleted successfully', 
      client: deletedClient 
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    
    // Log error
    await dbAgent.logError('admin_client_deletion_failed', error, {
      userId: req.session?.user?.user_id || req.session?.user?.id,
      sessionId: req.sessionID,
      endpoint: `${req.method} ${req.path}`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      client_id: req.params.id,
      severity: 'error',
      component: 'ClientManagement'
    });

    return ApiResponses.error(res, 500, 'Failed to delete client');
  }
});


export default router;