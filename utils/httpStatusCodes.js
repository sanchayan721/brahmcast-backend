const httpErrorCodes = {
    clientError: {
        "BAD_REQUEST": 400,
        "ACCESS_UNAUTHORIZED": 401,
        "PAYMENT_REQUIRED": 402,
        "ACCESS_FORBIDDEN": 403,
        "RESOURCE_NOT_FOUND": 404,
        "METHOD_NOT_ALLOWED": 405,
        "ENTRY_NOT_ACCEPTABLE": 406,
        "TIME_OUT": 408,
        "CONFLICT": 409,
        "UNSUPPORTED_MEDIA": 415,
        "TOO_MANY_REQUESTS": 429,
        "LEGAL_REASONS": 451,
    },
    serverError: {
        "INTERNAL_SERVER_ERROR": 500,
        "NOT_IMPLEMENTED": 501,
        "BAD_GATEWAY": 502,
        "SERVICE_UNAVAILAVLE": 503,
        "GATEWAY_TIMEOUT": 504,
        "NETWORK_AUTHENTICATION_REQUIRED": 511,
    }
};

const httpSuccessCodes = {
    "OK": 200,
    "CREATED": 201,
    "ACCPEPTED": 202,
    "NO_CONTENT": 204,
    "RESET_CONTENT": 205,
    "PARTIAL_CONTENT": 206
};

module.exports = {
    httpErrorCodes,
    httpSuccessCodes
};