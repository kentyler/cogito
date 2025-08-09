/**
 * File Operations - Database operations for file and chunk management
 * Handles file uploads, chunks, and content management in the context schema
 */

import { FileOperationsCore } from './file-operations-core.js';
import { FileOperationsExtended } from './file-operations-extended.js';

export class FileOperations {
  constructor(connector) {
    this.connector = connector;
    this._core = new FileOperationsCore(connector);
    this._extended = new FileOperationsExtended(connector);
  }

  // Core operations delegation
  async getClientFiles(clientId, sourceTypes = ['upload', 'text-input']) {
    return await this._core.getClientFiles(clientId, sourceTypes);
  }

  async getFileById(fileId) {
    return await this._core.getFileById(fileId);
  }

  async getFileWithContent(fileId) {
    return await this._core.getFileWithContent(fileId);
  }

  async createFile(fileData) {
    return await this._core.createFile(fileData);
  }

  async deleteFile(fileId, clientId, sourceTypes = ['upload', 'text-input']) {
    return await this._core.deleteFile(fileId, clientId, sourceTypes);
  }

  // Extended operations delegation
  async getFileChunks(fileId, options = {}) {
    return await this._extended.getFileChunks(fileId, options);
  }

  async createChunk(chunkData) {
    return await this._extended.createChunk(chunkData);
  }

  async getFileStats(clientId) {
    return await this._extended.getFileStats(clientId);
  }
}