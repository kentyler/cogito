/**
 * File Processor - Handles file processing workflow
 * Extracted from FileUploadService to maintain file size limits
 */

import { fileTypeFromFile } from 'file-type';

export class FileProcessor {
  constructor(uploadManager, contentExtractor, vectorService) {
    this.uploadManager = uploadManager;
    this.contentExtractor = contentExtractor;
    this.vectorService = vectorService;
  }

  /**
   * Process a file and store it with vectors
   * @param {Object} fileData - File data from upload
   * @param {Object} options - Processing options
   * @returns {Object} - Created file upload record
   */
  async processFile(fileData, options = {}) {
    const {
      clientId = 6,
      description = null,
      tags = null,
      skipVectorization = false
    } = options;

    let fileUpload = null;

    try {
      // Detect file type
      const detectedType = await fileTypeFromFile(fileData.path);
      const mimeType = detectedType?.mime || fileData.mimetype;
      
      // Generate storage path
      const timestamp = Date.now();
      const safeName = fileData.originalname.replace(/[^a-zA-Z0-9_\..]/g, '_');
      const filename = `${timestamp}-${safeName}`;
      const storagePath = `uploads/${filename}`;
      
      // Create file upload record
      fileUpload = await this.uploadManager.createFileUpload({
        filename: fileData.originalname,
        mimeType,
        filePath: storagePath,
        fileSize: fileData.size,
        publicUrl: null, // Could add storage integration later
        bucketName: 'public',
        description,
        tags
      }, clientId);

      console.log(`File upload created with ID: ${fileUpload.id}`);

      // Start vectorization if not skipped
      if (!skipVectorization && fileUpload) {
        // Process in background
        setTimeout(() => {
          this.extractAndVectorizeContent(
            fileData.path,
            fileUpload.id,
            mimeType,
            clientId
          ).catch(error => {
            console.error(`Background vectorization failed for file ${fileUpload.id}:`, error);
          });
        }, 100);
      }

      return fileUpload;

    } catch (error) {
      console.error('Error processing file upload:', error);
      
      // Clean up file upload record if it was created but processing failed
      if (fileUpload && fileUpload.id) {
        try {
          await this.uploadManager.deleteFileUpload(fileUpload.id);
          console.log(`Cleaned up failed file upload: ${fileUpload.id}`);
        } catch (cleanupError) {
          console.error(`Failed to clean up file upload ${fileUpload.id}:`, cleanupError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Extract content and create embeddings for a file
   * @param {string} filePath - Path to the uploaded file
   * @param {string} fileUploadId - ID of the file upload record
   * @param {string} mimeType - MIME type of the file
   * @param {number} clientId - Client ID
   */
  async extractAndVectorizeContent(filePath, fileUploadId, mimeType, clientId) {
    try {
      console.log(`Starting content extraction for file: ${fileUploadId}`);
      
      // Extract text content
      const content = await this.contentExtractor.extractContent(filePath, mimeType);
      
      if (!content || content.trim().length === 0) {
        console.log(`No extractable text content found in file: ${fileUploadId}`);
        return;
      }

      console.log(`Extracted ${content.length} characters from file: ${fileUploadId}`);
      
      // Generate embeddings
      await this.vectorService.generateEmbeddings(fileUploadId, content, clientId);
      console.log(`Vector embeddings generated for file: ${fileUploadId}`);
      
    } catch (error) {
      console.error(`Content extraction and vectorization failed for file ${fileUploadId}:`, error);
      throw error;
    }
  }
}