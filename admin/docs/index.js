const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');

const port = 3000;
const app = express();

const indexContent = fs.readFileSync(path.join(__dirname, 'index.html')).toString();

app.get('/admin/docs/', (req, res) => res.send(indexContent));

// Start the server
http.createServer(app).listen(port);
console.log(`Listening on port ${port}`);

module.exports = app;
