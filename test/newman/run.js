const newman = require('newman');
const testsCollection = require('./glider.json');
// const fs = require('fs');

if (!process.env.GLIDER_HOST) {
  const deployment = require(`${process.cwd()}/deployment.json`);

  if (deployment && deployment.url) {
    process.env.GLIDER_HOST = deployment.url;
  } else {
    throw new Error('Glider host is required');
  }
}

// Glider API host
const apiHost = process.env.GLIDER_HOST;// https://staging.aggregator.windingtree.net

// List of tests to skip
const testsToSkip = [
  'F01',
  'F02'
];

// Collection filtering method
// and apply the Glider host value
const filterCollection = (collection, skipped) => ({
  ...collection,
  ...({
    item: collection.item.filter(t => !skipped.some(skip => RegExp(`^${skip}`).test(t.name)))
  }),
  ...({
    variable: collection.variable.map(v => {

      if (v.key === 'GLIDER_URL') {
        v.value = `${apiHost}/api/v1`;
      }

      if (v.key === 'GLIDER_ADMIN_URL') {
        v.value = `${apiHost}/admin/v1`;
      }

      return v;
    })
  })
});

newman
  .run({
    collection: filterCollection(testsCollection, testsToSkip),
    reporters: 'cli'
  })
  .on('start', () => {
    console.log('Running tests...');

    if (testsToSkip.length > 0) {
      console.log('Skipped tests:', testsToSkip);
    }
  })
  .on('done', (err) => {

    if (err) {
      console.log('Error(s) occurred during tests');
      throw err;
    }

    console.log('All tests are complete.');
  });
