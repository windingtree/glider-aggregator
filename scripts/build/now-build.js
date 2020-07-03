const fs = require('fs');

// Determine branch and environment
const githubBranch = process.env.VERCEL_GITHUB_COMMIT_REF || process.env.NOW_GITHUB_COMMIT_REF || 'undefined';
const environment = (githubBranch === 'master' ? 'production' : 'staging');

// Write it to the env.json configuration file
fs.writeFile('env.json', `${JSON.stringify({
  environment: environment,
  githubBranch: githubBranch,
  buildTime: new Date(),
})}`, err => {
  if (err) throw err
})