const exec = require('@actions/exec');

// Repository info
const baseRef = context.payload.pull_request.base.ref;
const headRef = context.payload.pull_request.head.ref;

// Run git command
const git = async (params = []) => {
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
      'git',
      [
        ...params
      ],
      options
    );

  return output;
};

const run = async () => {
  // Checkout to base ref
  await git([
    'checkout',
    baseRef
  ]);

  // Create new branch from the base ref
  await git([
    'checkout -b localmerge'
  ]);

  // Merge head ref into the created branch
  await git([
    'merge',
    headRef
  ]);
};

run()
  .catch(err => {
    core.info('An error occurred during creation of the localy merged branch');
    console.error(err);
    core.setFailed(err.message);
  });