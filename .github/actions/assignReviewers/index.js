const { GitHub, context } = require('@actions/github');
const core = require('@actions/core');

// Repository info
const { repo: { owner, repo } } = context;

// Pull request number
const number = context.payload.pull_request.number;

core.debug(`PR number: ${number}`);

// Action info
const githubToken = core.getInput('GITHUB_TOKEN', { required: true });
const pullReviewers = core.getInput('PULL_REVIEWERS', { required: true });

// Create GitHub client
const github = new GitHub(githubToken);

const run = async () => {
  
  if (number) {
    // Assign reviewers to the pull request
    await github.pulls.createReviewRequest({
      owner,
      repo,
      'pull_number': number,
      reviewers: String(pullReviewers).split(';')
    });
  } else {
    core.setFailed('Associated with commit pull request not found');
  }
};

run()
  .catch(err => {
    console.log('An error occurred during reviewers assignment');
    console.error(err);
    core.setFailed(err.message);
  });
