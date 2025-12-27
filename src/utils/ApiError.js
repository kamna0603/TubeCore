class ApiError extends Error {
  //ApiError is a custom error class used to standardize error handling in backend
  //  APIs by attaching HTTP status codes, messages, and structured error data.
  constructor(
    statusCode,
    message = "Something went Wrong",
    errors = [],
    stack = ""
  ) {
    super(message); //Passes message to parent Error class and Required when extending Error class
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor); //Captures where the error occurred and Helps debugging
    }
  }
}
export {ApiError}
