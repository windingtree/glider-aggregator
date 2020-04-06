const { GitHub, context } = require('@actions/github');
const core = require('@actions/core');

// Repository info
const { repo: { owner, repo } } = context;

// Pull request number
const number = context.payload.pull_request.number;

// Action info
const githubToken = core.getInput('GITHUB_TOKEN', { required: true });

// Create GitHub client
const github = new GitHub(githubToken);

const run = async () => {
  
  if (number) {
    // Initiate merge
    const merge = await github.pulls.merge({
      owner,
      repo,
      'pull_number': number,
      'commit_message': `Pull request #${number} has been automatically merged`
    });

    if (!merge || merge.data) {
      core.setFailed('Cannot get merge result data');
      return;
    }

    if (merge.data.merged) {
      core.info(merge.data.message);
    } else {
      await github.issues.createComment({
        ...context.repo,
        'issue_number': context.issue.number,
        body: `Automatic merge of the PR is failed\n${merge.data.message}\n[${merge.data.documentation_url}](${merge.data.documentation_url})`
      });
      core.setFailed(merge.data.message);
    }
  } else {
    core.setFailed('Pull request not found');
  }
};

run()
  .catch(err => {
    core.info('An error occurred during merge handling');
    console.error(err);
    core.setFailed(err.message);
  });
