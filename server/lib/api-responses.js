/**
 * Standardized API response helpers for consistent error and success patterns
 */

export const ApiResponses = {
  /**
   * Send a standardized error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 500, etc.)
   * @param {string} message - Error message
   * @param {Object} [details] - Optional additional error details
   */
  error(res, statusCode, message, details = null) {
    const response = { error: message };
    if (details) {
      response.details = details;
    }
    return res.status(statusCode).json(response);
  },

  /**
   * Send a standardized success response with data
   * @param {Object} res - Express response object
   * @param {*} data - Data to send in response
   * @param {number} [statusCode=200] - HTTP status code (defaults to 200)
   */
  success(res, data, statusCode = 200) {
    return res.status(statusCode).json(data);
  },

  /**
   * Send a success response with wrapped data and metadata
   * @param {Object} res - Express response object
   * @param {*} data - Data to send
   * @param {Object} [meta] - Optional metadata (pagination, counts, etc.)
   * @param {number} [statusCode=200] - HTTP status code
   */
  successWithMeta(res, data, meta = null, statusCode = 200) {
    const response = { data };
    if (meta) {
      response.meta = meta;
    }
    return res.status(statusCode).json(response);
  },

  /**
   * Send a simple success confirmation
   * @param {Object} res - Express response object
   * @param {string} [message='Success'] - Success message
   * @param {Object} [details] - Optional additional details
   */
  successMessage(res, message = 'Success', details = null) {
    const response = { success: true, message };
    if (details) {
      Object.assign(response, details);
    }
    return res.json(response);
  },

  // Common error responses
  badRequest(res, message = 'Bad request', details = null) {
    return this.error(res, 400, message, details);
  },

  unauthorized(res, message = 'Authentication required') {
    return this.error(res, 401, message);
  },

  forbidden(res, message = 'Access denied') {
    return this.error(res, 403, message);
  },

  notFound(res, message = 'Resource not found') {
    return this.error(res, 404, message);
  },

  internalError(res, message = 'Internal server error', details = null) {
    return this.error(res, 500, message, details);
  },

  // Database connection error (commonly used)
  databaseError(res, message = 'Database connection failed') {
    return this.internalError(res, message);
  }
};