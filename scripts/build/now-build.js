const fs = require('fs');
fs.writeFile('built-env.js', `module.exports = '${JSON.stringify(process.env)}'`, err => {
  if (err) throw err
  console.log('Build file created successfully!');
})
