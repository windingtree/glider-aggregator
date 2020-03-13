// Custom error class which supports error code
module.exports = class GliderError extends Error {
  constructor (...args) {
    super(args[0]);
    this.code = args[1] || 500;
  }
};
