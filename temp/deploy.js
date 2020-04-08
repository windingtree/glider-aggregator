const exec = require('@actions/exec');

process.env.NOW_PROJECT_ID = 'Qmbr7GyiYUim1C8qTVm1aqANJe7E8CcK8hSvpsqrJWPuPy';
process.env.NOW_ORG_ID = 'team_tjrKqn5dUG7yCZxHSDoyFEnL';
const nowToken = '33rEgvWnhyQJssD3Dbcv46oD';
const sha = '6fde4d7e492750b484f537d022ee8ebb5a8caf7a';

const deploy = async () => {
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
        'now',
        '-t',
        nowToken,
        '-m',
        `sha=${sha}`
      ],
      options
    );

  console.log(output);

  return output;
};

const run = async () => {
  await deploy();

};

run()
  .catch(err => {
    console.log('An error occurred during deployment');
    console.error(err);
  });
