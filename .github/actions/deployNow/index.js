const { GitHub, context } = require('@actions/github');
const exec = require('@actions/exec');
const core = require('@actions/core');

// Commit information
const { repo: { owner, repo }, sha } = context;

// Action Info
const nowToken = core.getInput('NOW_TOKEN', { required: true });
const nowProjectId = core.getInput('NOW_PROJECT_ID', { required: true });
const nowOrgId = core.getInput('NOW_ORG_ID', { required: true });
const githubToken = core.getInput('GITHUB_TOKEN', { required: true });
const nowArgs = core.getInput("NOW_ARGS");

// Create GitHub client
const github = new GitHub(githubToken);

// Project credentials
core.exportVariable('NOW_PROJECT_ID', nowProjectId);
core.exportVariable('NOW_ORG_ID', nowOrgId);

// Write comment to the PR
const writePrComment = async (issueNumber, body) => await github.issues.createComment({
  ...context.repo,
  'issue_number': issueNumber,
  body
});

// Deploy current commit to the Zeit
const deployNow = async () => {
  let deployedUrl = '';
  
  const options = {
    cwd: process.cwd(),
    listeners: {
      stdout: data => {
        deployedUrl += data.toString();
      }
    }
  };

  await exec
    .exec(
      'npx',
      [
        'now',
        ...nowArgs.split(/ +/),
        '-t',
        nowToken,
        '-m',
        `sha=${sha}`
      ],
      options
    );

  core.info('Deployment finished');

  if (!deployedUrl) {
    return core.setFailed('Deployment URL not found');
  }

  return deployedUrl;
};

// Action 
const run = async () => {
  const url = await deployNow();
  core.info(`Current commit is deployed on the URL: ${url}`);

  // Write a comment on the PR wall
  await writePrComment(
    context.issue.number,
    `PR has been deployed to the URL: [${url}](${url})`
  );

  // export GLIDER_HOST variable for the next step
  core.exportVariable('GLIDER_HOST', url);
};

run()
  .catch(err => {
    console.log('An error occurred during deployment');
    console.error(err);
    core.setFailed(err.message);
  });
