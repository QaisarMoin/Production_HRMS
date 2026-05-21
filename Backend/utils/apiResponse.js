/**
 * Standard API Response Structure
 * This utility provides consistent API responses across all endpoints
 */

class ApiResponse {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {String} message - Success message
   * @param {*} data - Response data
   * @param {Number} statusCode - HTTP status code (default: 200)
   * @param {Object} pagination - Pagination info
   */
  static success(
    res,
    message = "Success",
    data = null,
    statusCode = 200,
    pagination = null,
  ) {
    const response = {
      success: true,
      message,
      data,
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {*} data - Error data
   * @param {Number} statusCode - HTTP status code (default: 500)
   */
  static error(
    res,
    message = "An error occurred",
    data = null,
    statusCode = 500,
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      data,
    });
  }

  /**
   * Validation error response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Array} errors - Array of validation errors
   */
  static validationError(res, message = "Validation failed", errors = []) {
    return res.status(400).json({
      success: false,
      message,
      data: null,
      errors,
    });
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static notFound(res, message = "Resource not found") {
    return res.status(404).json({
      success: false,
      message,
      data: null,
    });
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static unauthorized(res, message = "Unauthorized access") {
    return res.status(401).json({
      success: false,
      message,
      data: null,
    });
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static forbidden(res, message = "Access forbidden") {
    return res.status(403).json({
      success: false,
      message,
      data: null,
    });
  }

  /**
   * Created response
   * @param {Object} res - Express response object
   * @param {String} message - Success message
   * @param {*} data - Response data
   */
  static created(res, message = "Resource created successfully", data = null) {
    return this.success(res, message, data, 201);
  }
}

module.exports = ApiResponse;
