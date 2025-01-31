const formatResponse = (data, message = 'Success', metadata = {}) => {
  return {
    status: 'success',
    message,
    data,
    metadata: {
      timestamp: new Date(),
      ...metadata
    }
  };
};

const formatError = (message, errors = null, code = null) => {
  return {
    status: 'error',
    message,
    errors,
    code,
    timestamp: new Date()
  };
};

const formatPagination = (data, page, limit, total) => {
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  formatResponse,
  formatError,
  formatPagination
};
