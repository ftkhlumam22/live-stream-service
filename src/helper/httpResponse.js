const successResponse = (res, data) => {
  return res.status(200).json({
    code: 200,
    status: "OK",
    success: true,
    data,
  });
};

const successResponsePagination = (res, data, page, limit, total) => {
  return res.status(200).json({
    code: 200,
    status: "OK",
    success: true,
    data,
    pagination: {
      page: page,
      limit: limit,
      total: total,
    },
  });
};

const createdResponse = (res, data) => {
  return res.status(201).json({
    code: 201,
    status: "CREATED",
    success: true,
    data,
  });
};

const noContentResponse = (res) => {
  return res.status(204).json({
    code: 204,
    status: "NO_CONTENT",
    success: true,
  });
};

const badRequestResponse = (res, message) => {
  return res.status(400).json({
    code: 400,
    status: "BAD_REQUEST",
    success: false,
    message,
  });
};

const notFoundResponse = (res, message) => {
  return res.status(404).json({
    code: 404,
    status: "NOT_FOUND",
    success: false,
    message,
  });
};

const unauthorizedResponse = (res, message) => {
  return res.status(401).json({
    code: 401,
    status: "UNAUTHORIZED",
    success: false,
    message,
  });
};

const forbiddenResponse = (res, message) => {
  return res.status(403).json({
    code: 403,
    status: "FORBIDDEN",
    success: false,
    message,
  });
};

const serverErrorResponse = (res, message) => {
  return res.status(500).json({
    code: 500,
    status: "INTERNAL_SERVER_ERROR",
    success: false,
    message,
  });
};

const serviceUnavailableResponse = (res, message) => {
  return res.status(503).json({
    code: 503,
    status: "SERVICE_UNAVAILABLE",
    success: false,
    message,
  });
};

const apiResponse = {
  successResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
  serviceUnavailableResponse,
  successResponsePagination,
};

module.exports = apiResponse;
