export default class CustomError extends Error {
  cause: string | string[];
  constructor(cause: string | string[], message: string) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
    // the name property is the name of whoever calls this CustomError Constructor
    this.name = this.constructor.name;
    // Custom debugging information
    this.cause = cause;
  }
}
