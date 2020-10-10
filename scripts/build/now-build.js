const fs = require('fs');
const { getFeatureFlagsAsync } = require('../../helpers/businessrules/featureFlagEngine');
// Determine branch and environment
const githubBranch = process.env.VERCEL_GITHUB_COMMIT_REF || process.env.NOW_GITHUB_COMMIT_REF || 'undefined';
const environment = (githubBranch === 'master' ? 'production' : 'staging');

// Write it to the env.json configuration file
fs.writeFile('env.json', `${JSON.stringify({
  environment: environment,
  githubBranch: githubBranch,
  buildTime: new Date(),
})}`, err => {
  if (err) {
    console.error('Error while generating env.json', err);
    throw err;
  }
});

console.log('Generate features.json');
getFeatureFlagsAsync().then(features => {
  fs.writeFile('features.json', JSON.stringify(features), err => {
    if (err) {
      console.error('Error while generating features.json', err);
      throw err;
    }
  });
}).catch(err => {
  console.error('Failed to retrieve feature flags!', err);
  throw err;
});
