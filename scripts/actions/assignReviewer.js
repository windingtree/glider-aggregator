const { GitHub, context } = require('@actions/github');
const core = require('@actions/core');

const run = async () => {
  const githubToken = 'a1fd832f7273e7ec4ff1a4440f058a73fcdeb8b7';// core.getInput('GITHUB_TOKEN', { required: true });
  const { repo: { owner, repo } } = context;
  const sha = core.getInput('sha');

  // Create GitHub client
  const client = new GitHub(githubToken);
  
  // Get reviewers from environment
  const reviewers = core.getInput('PULL_REVIEWERS').split(';');

  // Get pull request number from the context
  const result = await client.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    'commit_sha': sha || context.sha,
  });
  const pullNumber = result.data.length > 0 && result.data[0];
  
  // Assign reviewers to the pull request
  await client.pulls.createReviewRequest({
    owner,
    repo,
    'pull_number': pullNumber,
    reviewers
  });
};

run()
  .catch(err => {
    console.log('An error occurred during reviewers assignment.');
    throw err;
  });
