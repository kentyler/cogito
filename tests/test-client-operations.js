import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { DatabaseAgent } from '../lib/database-agent.js';

describe('Client Operations', function() {
  this.timeout(10000);
  
  let dbAgent;
  let testClientId;
  const testClientName = `Test Client ${Date.now()}`;
  
  before(async function() {
    dbAgent = new DatabaseAgent();
    await dbAgent.connect();
  });
  
  after(async function() {
    // Clean up test client if it exists
    if (testClientId) {
      try {
        await dbAgent.clients.deleteClient(testClientId);
      } catch (error) {
        console.log('Test client already deleted or does not exist');
      }
    }
    await dbAgent.disconnect();
  });
  
  describe('Client CRUD Operations', function() {
    it('should create a new client', async function() {
      const clientData = {
        name: testClientName,
        story: 'Test client for automated testing',
        metadata: { test: true }
      };
      
      const client = await dbAgent.clients.createClient(clientData);
      
      expect(client).to.be.an('object');
      expect(client.id).to.be.a('number');
      expect(client.name).to.equal(testClientName);
      expect(client.story).to.equal('Test client for automated testing');
      
      testClientId = client.id;
    });
    
    it('should get client by ID', async function() {
      const client = await dbAgent.clients.getClientById(testClientId);
      
      expect(client).to.be.an('object');
      expect(client.id).to.equal(testClientId);
      expect(client.name).to.equal(testClientName);
    });
    
    it('should update a client', async function() {
      const updates = {
        name: `${testClientName} Updated`,
        story: 'Updated test description'
      };
      
      const updatedClient = await dbAgent.clients.updateClient(testClientId, updates);
      
      expect(updatedClient).to.be.an('object');
      expect(updatedClient.name).to.equal(`${testClientName} Updated`);
      expect(updatedClient.story).to.equal('Updated test description');
    });
    
    it('should get client statistics', async function() {
      const stats = await dbAgent.clients.getClientStats(testClientId);
      
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('user_count');
      expect(stats).to.have.property('meeting_count');
      expect(stats).to.have.property('file_count');
      expect(stats.user_count).to.be.a('number');
      expect(stats.meeting_count).to.be.a('number');
      expect(stats.file_count).to.be.a('number');
    });
    
    it('should get all clients with stats', async function() {
      const clients = await dbAgent.clients.getAllClientsWithStats();
      
      expect(clients).to.be.an('array');
      expect(clients.length).to.be.greaterThan(0);
      
      // Find our test client
      const testClient = clients.find(c => c.id === testClientId);
      expect(testClient).to.exist;
      expect(testClient).to.have.property('user_count');
      expect(testClient).to.have.property('meeting_count');
      expect(testClient).to.have.property('file_count');
    });
    
    it('should return null for non-existent client', async function() {
      const client = await dbAgent.clients.getClientById(999999);
      expect(client).to.be.null;
    });
    
    it('should delete a client', async function() {
      const deletedClient = await dbAgent.clients.deleteClient(testClientId);
      
      expect(deletedClient).to.be.an('object');
      expect(deletedClient.id).to.equal(testClientId);
      
      // Verify deletion
      const client = await dbAgent.clients.getClientById(testClientId);
      expect(client).to.be.null;
      
      // Clear testClientId so cleanup doesn't try to delete again
      testClientId = null;
    });
  });
  
  describe('Client Validation', function() {
    it('should handle invalid client ID gracefully', async function() {
      const client = await dbAgent.clients.getClientById('invalid');
      expect(client).to.be.null;
    });
    
    it('should handle empty client name on create', async function() {
      try {
        await dbAgent.clients.createClient({ name: '' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
      }
    });
    
    it('should handle missing client name on create', async function() {
      try {
        await dbAgent.clients.createClient({});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });
});