const { basicDecorator } = require('../../../decorators/basic');
const { debugInfo } = require('../../../config');

module.exports = basicDecorator(async (req, res) => {
    res.json({
        code: 200,
        message: "OK",
        data: debugInfo(),
    });
}, true); // true - means administrative route
