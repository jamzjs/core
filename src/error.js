/**
 * @class HttpError
 * @classdesc Represents a general http error
 * @property {string} message
 * @property {number} code
 */
export class HttpError extends Error {
    code = 500;
    message = 'Internal Server Error';
}

/**
 * @class MethodNotAllowedError
 * @classdesc Represents MethodNotAllowed http error
 * @extends HttpError
 */
export class MethodNotAllowedError extends HttpError {
    code = 405;
    message = 'Method Not Allowed';
}

export class NotFoundError extends HttpError {
    code = 404;
    message = 'Unknown path';
}

export class ModelNotDefinedError extends HttpError {
    message = 'Model is not defined for class';
}