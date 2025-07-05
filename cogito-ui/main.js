const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ClaudeService = require('./claude-service');

// Load environment variables
require('dotenv').config();

let mainWindow;
let powershellProcess;
let claudeService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools for development
  mainWindow.webContents.openDevTools();
}

// Initialize PowerShell process
function initPowerShell() {
  // Check if we're on Linux and use Node.js instead
  if (process.platform !== 'win32') {
    console.log('Using Node.js database handler for Linux');
    initNodeDatabase();
    return;
  }
  
  // Windows: use PowerShell
  const scriptPath = path.join(__dirname, 'db-session.ps1');
  
  powershellProcess = spawn('pwsh', ['-NoProfile', '-File', scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  powershellProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('PowerShell output:', output);
    // Handle connection ready signal
    if (output.trim() === 'CONNECTION_READY' || output.trim() === 'USING_PSQL_FALLBACK') {
      console.log('Database session initialized:', output);
    } else {
      mainWindow.webContents.send('powershell-output', output);
    }
  });

  powershellProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error('PowerShell error:', error);
    mainWindow.webContents.send('powershell-error', error);
  });
  
  powershellProcess.on('error', (err) => {
    console.error('Failed to start PowerShell:', err);
    mainWindow.webContents.send('powershell-error', 'PowerShell not available');
  });
}

// Node.js database handler for Linux
function initNodeDatabase() {
  const dbScriptPath = path.join(__dirname, 'db-handler.js');
  
  powershellProcess = spawn('node', [dbScriptPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  powershellProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('DB handler output:', output);
    mainWindow.webContents.send('powershell-output', output);
  });

  powershellProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error('DB handler error:', error);
    mainWindow.webContents.send('powershell-error', error);
  });
}

// Handle PowerShell command execution
ipcMain.on('execute-powershell', (event, command) => {
  if (powershellProcess) {
    powershellProcess.stdin.write(command + '\n');
  }
});

// Handle Claude API command execution
ipcMain.on('execute-claude', async (event, prompt) => {
  try {
    if (!claudeService) {
      claudeService = new ClaudeService();
    }

    // Check if this is a summary request or general analysis
    if (prompt.includes('create a concise but detailed summary')) {
      // Extract the content for summary
      const contentMatch = prompt.match(/Recent conversation content:\n([\s\S]+)\n\nProvide a well-structured summary/);
      if (contentMatch) {
        const content = contentMatch[1];
        const response = await claudeService.generateSummary(content, {
          clientName: 'Current Client',
          teamSize: 'Multiple'
        });
        
        if (response.success) {
          event.reply('claude-response', response.content);
        } else {
          event.reply('claude-error', response.error);
        }
      } else {
        // Fallback to general response
        const response = await claudeService.generateResponse(prompt);
        if (response.success) {
          event.reply('claude-response', response.content);
        } else {
          event.reply('claude-error', response.error);
        }
      }
    } else {
      // General analysis request
      const response = await claudeService.generateResponse(prompt);
      if (response.success) {
        event.reply('claude-response', response.content);
      } else {
        event.reply('claude-error', response.error);
      }
    }
  } catch (err) {
    console.error('Claude API error:', err);
    event.reply('claude-error', `Error calling Claude API: ${err.message}`);
  }
});

// Handle getting Supabase config
ipcMain.handle('get-supabase-config', async () => {
  return {
    url: process.env.SUPABASE_URL || 'https://hpdbaeurycyhqigiatco.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZGJhZXVyeWN5aHFpZ2lhdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMzgzMTYsImV4cCI6MjA0OTYxNDMxNn0.YBT3xBgkYWCBCXNy99YBz5fNgaLyF91L0-y_cAP7oKE'
  };
});

// Handle file upload dialog
ipcMain.handle('show-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['txt', 'md', 'json', 'pdf', 'doc', 'docx'] },
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    try {
      // Read file content
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      const fileSize = fs.statSync(filePath).size;
      
      return {
        success: true,
        fileName,
        fileSize,
        fileContent: fileBuffer.toString('base64'), // Convert to base64 for transfer
        mimeType: getMimeType(path.extname(fileName))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  return { success: false, canceled: true };
});

// Helper function to get MIME type
function getMimeType(extension) {
  const mimeTypes = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

app.whenReady().then(() => {
  createWindow();
  initPowerShell();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (powershellProcess) {
    powershellProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});