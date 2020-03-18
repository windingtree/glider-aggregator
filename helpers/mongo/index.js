const mongoose = require('mongoose');
const config = require('../../config');

mongoose.connect(config.mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB:', Date.now());
});

// Close connetion to the MongoDB on exit
process.on('exit', function () {
  mongoose.disconnect();
  console.log('Disconnected from MongoDB:', Date.now());
});

module.exports = {
  mongoose,
  db
};
