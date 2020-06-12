const { basicDecorator } = require('../../../decorators/basic');
const { debugInfo } = require('../../../config');
const BuiltEnv = require('../../../built-env');


module.exports = basicDecorator(async (req, res) => {
    res.json({
        code: 200,
        message: "OK",
        data: debugInfo(),
        builtEnv: BuiltEnv
    });
}, true); // true - means administrative route
