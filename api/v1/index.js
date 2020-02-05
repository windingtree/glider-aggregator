import { name, description, version } from '../package.json';

module.exports = async (req, res) => {
    const response = {
        name, description, version,
    };
    res.status(200).json(response);
}