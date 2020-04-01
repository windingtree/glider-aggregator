const newman = require('newman');
const testsCollection = require('./glider.json');

const testsToSkip = [
  'F01',
  'F02'
];

const filterCollection = (collection, skipped) => ({
  ...collection,
  ...({
    item: collection.item.filter(t => !skipped.some(skip => RegExp(`^${skip}`).test(t.name)))
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
      throw err;
    }

    console.log('All tests are complete.');
  });
