const fs = require('fs');
const core = require('@actions/core');
const exec = require('@actions/exec');

// Action Info
const nowToken = core.getInput('NOW_TOKEN', { required: true });
const projectId = core.getInput('NOW_PROJECT_ID', { required: true });
const orgId = core.getInput('NOW_ORG_ID', { required: true });

// Now dir path
const nowDir = './.now'

// Main action method
const run = async () => {
  
  if (!fs.existsSync(nowDir)){
    fs.mkdirSync(nowDir);
  }
  
  fs.writeFileSync(
    `${nowDir}/project.json`,
    JSON.stringify({
      projectId,
      orgId
    })
  );

  let output = '';
  
  const options = {
    cwd: process.cwd(),
    listeners: {
      stdout: data => {
        output += data.toString();
      }
    }
  };

  await exec
    .exec(
      'npx',
      [
        'now dev &'
      ],
      options
    );

  core.ingo(`Output: ${output}`);
};

run()
  .catch(err => {
    core.info('An error occurred during now dev server run');
    console.error(err);
    core.setFailed(err.message);
  });