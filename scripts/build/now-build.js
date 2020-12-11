const fs = require('fs');
const path = require('path');
const profiles = require('@windingtree/config-profiles');
const activeProfile = profiles.determineActiveProfile();

console.log('Active profile:', activeProfile);
profiles.init({
  baseFolder: path.join(process.cwd(), 'api/profiles'),
  dbUrl: profiles.getEnvironmentEntry(activeProfile, 'MONGO_URL'),
  encryptionDetails: profiles.getEnvironmentEntry(activeProfile, 'PROFILE_SECRET')
}
);


profiles.dumpProfile(activeProfile).then(()=>{
  console.log(`profile ${activeProfile} successfully generated`);
  process.exit(0);
}).catch(err=>{
  console.error(`profile ${activeProfile} generation failed, ${err}`);
  process.exit(-1);
});




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
