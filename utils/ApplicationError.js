class ApplicationError extends Error {
    constructor(message, httpStatus, cause) {
        super();
        this.name = "ApplicationError";
        this.message = message;
        this.httpStatus = httpStatus;
        this.cause = cause;
    }
}

module.exports = ApplicationError;