/* istanbul ignore file */
const { name, description, version } = require('../package.json');

module.exports = async (req, res) => {
  const response = {
    name,
    description,
    version,
  };
  res.status(200).json(response);
};
