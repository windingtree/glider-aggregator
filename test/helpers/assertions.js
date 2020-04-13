const assert = require('assert');

/**
 * Assert promise execution failure
 * @param {Object} promise Promise object to process
 * @param {boolean} [reason=null] Revert reason to compare
 */
module.exports.assertFailure = async (promise, reason = false, code = null) => {

  try {
    await promise;
    assert.fail('The assertion is fulfilled although failure was expected');
  } catch (error) {
    
    if (reason) {
      const reasonFoundByString = error.message
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
