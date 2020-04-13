const { GitHub, context } = require('@actions/github');
const core = require('@actions/core');
const { stringifyCircular } = require('../../../helpers/json');

// Repository info
const { repo: { owner, repo } } = context;

// Pull request number
const number = context.payload.pull_request.number;

// Head Ref
const ref = `heads/${context.payload.pull_request.head.ref}`;

// Action info
const githubToken = core.getInput('GITHUB_TOKEN', { required: true });

// Create GitHub client
const github = new GitHub(githubToken);

// Parse reviews list
const parseReviews = async (data) => {
  let compiled = {};

  if (data && Object.keys(data).length > 0) {

    data.forEach(element => {
      const user = element.user.login;
      const date = element.submitted_at;
      const state = element.state;

      if (typeof (compiled[user]) !== 'undefined') {
        
        if (date > compiled[user].date) {
          compiled[user] = {
            date: date,
            state: state
          };
        }
      } else {
        compiled[user] = {
          date: date,
          state: state
        };
      }
    });
  }

  return compiled;
};

// Parse checks result
const parseChecks = async (data) => {
  const total = data.total_count;
  data = data.check_runs;

  let compiled = {
    total,
    completed: 0,
    success: 0
  };

  if (data && Object.keys(data).length > 0) {
    
    data.forEach(element => {

      if (String(element.status).toLocaleLowerCase() === 'completed') {
          compiled.completed++;
      }

      if (String(element.conclusion).toLocaleLowerCase() === 'success') {
          compiled.success++;
      }
    });
  }

  return compiled;
};

const run = async () => {
  core.debug(`Context: ${stringifyCircular(context, 2)}`);
  core.debug(`Repo: ${stringifyCircular(context.repo, 2)}`);
  core.debug(`PR Number: ${number}`);
  core.debug(`Ref: ${ref}`);

  if (number) {
    
    // Get list of reviews
    const reviewsList = await github.pulls.listReviews({
      owner,
      repo,
      'pull_number': number
    });

    if (!reviewsList || !reviewsList.data) {
      core.setFailed('Cannot get list of submitted reviews');
      return;
    }

    core.debug(`listReviews: ${stringifyCircular(reviewsList.data, 2)}`);

    // Get list of all checks
    const checksList = await github.checks.listForRef({
      owner,
      repo,
      ref 
    });

    if (!checksList || !checksList.data) {
      core.setFailed('Cannot get list of checks');
      return;
    }

    core.debug(`listForRef: ${stringifyCircular(checksList.data, 2)}`);

    const reviews = await parseReviews(reviewsList.data);
    const checks = await parseChecks(checksList.data);

    core.debug(`Reviews: ${stringifyCircular(reviews, 2)}`);
    core.debug(`Checks: ${stringifyCircular(checks, 2)}`);

    if (Object.keys(reviews).length === 0) {
      core.setFailed('Not reviewed yet');
      return;
    }

    for (let [key, value] of Object.entries(reviews)) {
      
      if (String(value.state).toLocaleLowerCase() !== 'approved') {
        core.setFailed('Not approved yet');
        return;
      }
    }

    if ((checks.completed >= (checks.total - 1)) &&
        (checks.success >= (checks.total - 1))) {
      
      core.info(`Pull request #${number} approved`);
    } else {
      core.setFailed('Some checks not succeeded');
    }
    
  } else {
    core.setFailed('Pull request not found');
  }
};

run()
  .catch(err => {
    core.info('An error occurred during approvals handling');
    console.error(err);
    core.setFailed(err.message);
  });
