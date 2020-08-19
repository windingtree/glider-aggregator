const assert = require('assert');

/**
 * Assert promise execution failure
 * @param {Object} promise Promise object to process
 * @param {boolean} [reason=null] Revert reason to compare
 */
module.exports.assertFailure = async (promise, reason = false, code = null) => {

  try {
    
    if (typeof promise.then === 'function') {
      await promise;
    } else if (typeof promise === 'function') {
      promise();
    } else {
      assert.fail(
        'First parameter of the "assertFailure" expected to be a promise or function'
      );
    }

    assert.fail('The assertion is fulfilled although failure was expected');
  } catch (error) {
    
    if (reason) {
      const reasonFoundByString = error.message === reason || error.message
        .toLowerCase().search(reason.toLowerCase()) >= 0;
      
      assert(
        reasonFoundByString,
        `Expected "error"${reason ? ' with message "'+reason+'"' : ''}, got ${error} instead`
      );
    }

    if (code) {
      assert(
        error.status === code,
        `Expected error code equal ${code}, got ${error.code}`
      );
    }
  }
};
