const { GitHub } = require('@actions/github');

const token = 'e605f53a8be832f85069124b4d7e5f4fcf754766';
// const sha = '477a3ada8344b23fb65f493066254765a0c43558';
const owner = 'kostysh';
const repo = 'glider-aggregator';
const ref = 'heads/feature/ci';

const github = new GitHub(token);

const run = async () => {
  // const number = 7;

  // Get list of all review requests
  const res = await github.checks.listForRef({
    owner,
    repo,
    ref
  });

  console.log(JSON.stringify(res.data, null, 2));

  // if (!requestsList || requestsList.data) {
  //   core.setFailed('Cannot get list of review requests');
  //   return;
  // }

  // if (requestsList.data.users.length > 0) {
  //   core.setFailed('Reviews are not assigned');
  //   return;
  // }

  // // Get list of reviews
  // const reviewsList = await github.pulls.listReviews({
  //   owner,
  //   repo,
  //   'pull_number': number
  // });

  // if (!reviewsList || reviewsList.data) {
  //   core.setFailed('Cannot get list of reviews');
  //   return;
  // }

  // const users = reviewsList.data.reduce((a, v) => {

  //   if (!a.includes(v.user.login)) {
  //     a.push(v.user.login);
  //   }

  //   return a;
  // }, []);

  // let approvals = [];
  // for (const user of users) {
  //   const userReviews = reviewsList
  //     .data
  //     .filter(r => r.user.login === user)
  //     .sort(
  //       (r, o) => (new Date(o.submitted_at)).getTime() - (new Date(r.submitted_at)).getTime()
  //     );
  //   approvals.push(String(userReviews[0].state).toLocaleLowerCase() === 'approved');
  // }

  // if (approvals.includes(false)) {
  //   core.setFailed('PR not yet reviewed');
  //   return;
  // }
};

run().catch(console.error);
