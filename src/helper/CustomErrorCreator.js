export default class CustomError extends Error {
  constructor(name, cause, message, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    this.name = name ? name : 'CustomError';
    // Custom debugging information
    this.cause = cause;
  }
}
