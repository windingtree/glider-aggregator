const { GitHub, context } = require('@actions/github');
const core = require('@actions/core');
const { stringifyCircular } = require('../../../helpers/json');

// Repository info
const { repo: { owner, repo } } = context;

// Action info
const githubToken = core.getInput('GITHUB_TOKEN', { required: true });

// Create GitHub client
const github = new GitHub(githubToken);

const run = async () => {
  // Pull request number
  const number = context.payload.pull_request.number;

  core.debug(`Repo:\n Owner: ${number}\n repo: ${repo}`);
  core.debug(`PR Number: ${number}`);

  if (number) {
    
    // Get list of all review requests
    const requestsList = await github.pulls.listReviewRequests({
      owner,
      repo,
      'pull_number': number
    });

    core.debug(`listReviewRequests: ${stringifyCircular(requestsList.data, 2)}`);

    if (!requestsList || requestsList.data) {
      core.setFailed('Cannot get list of review requests');
      return;
    }

    if (requestsList.data.users.length > 0) {
      core.setFailed('Reviews are not assigned');
      return;
    }

    // Get list of reviews
    const reviewsList = await github.pulls.listReviews({
      owner,
      repo,
      'pull_number': number
    });

    core.debug(`listReviews: ${stringifyCircular(reviewsList.data, 2)}`);

    if (!reviewsList || reviewsList.data) {
      core.setFailed('Cannot get list of reviews');
      return;
    }

    const users = reviewsList.data.reduce((a, v) => {

      if (!a.includes(v.user.login)) {
        a.push(v.user.login);
      }
  
      return a;
    }, []);

    core.debug(`Reviewers: ${stringifyCircular(users)}`);
  
    let approvals = [];
    for (const user of users) {
      const userReviews = reviewsList
        .data
        .filter(r => r.user.login === user)
        .sort(
          (r, o) => (new Date(o.submitted_at)).getTime() - (new Date(r.submitted_at)).getTime()
        );
      approvals.push(String(userReviews[0].state).toLocaleLowerCase() === 'approved');
    }

    core.debug(`Approvals: ${stringifyCircular(approvals)}`);
  
    if (approvals.includes(false)) {
      core.setFailed('PR not yet reviewed');
      return;
    }

    core.info(`Pull request #${number} approved`);
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
