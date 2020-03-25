export default new (function () {
  // Taken from MDN
  function CustomError(message, name) {
    var instance = new Error(message);
    instance.name = name ? name : 'CustomError';
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    if (Error.captureStackTrace) {
      Error.captureStackTrace(instance, CustomError);
    }
    return instance;
  }

  CustomError.prototype = Object.create(Error.prototype, {
    constructor: {
      value: Error,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });

  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(CustomError, Error);
  } else {
    // eslint-disable-next-line no-proto
    CustomError.__proto__ = Error;
  }

  return CustomError;
})();
