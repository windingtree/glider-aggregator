// Custom error class which supports error code
module.exports = class GliderError extends Error {
  constructor (...args) {
    super(args[0]);
    this.status = args[1] || 500;

    if (args[2]) {
      this.code = args[2];
    }
  }
};
