const { httpErrorCodes } = require("./httpStatusCodes");

class ErrorSender {

    #error;
    #res;

    constructor(error, res) {
        this.#error = error;
        this.#res = res;
    }

    sendError() {
        switch (this.#error?.name) {
            case 'ValidationError':
                let { path, message } = Object.values(this.#error?.errors)[0]?.properties;
                this.#res.status(httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE).json({
                    'property': path,
                    'errorMessage': message
                });
                break;

            case 'ApplicationError':
                this.#res.status(
                    this.#error?.httpStatus || httpErrorCodes.serverError.INTERNAL_SERVER_ERROR
                ).json({ ...this.#error?.cause });
                break;

            default:
                this.#res.sendStatus(httpErrorCodes.serverError.INTERNAL_SERVER_ERROR);
                break;
        };
    }
};

module.exports = ErrorSender;