const { expect } = require('chai');
const { FeatureFlagEngine } = require('./featureFlagEngine');


let feat1_develop = {
  'comment': 'Sample feature#1, rule for branch=DEVELOP, with additional parameters',
  'conditions': { 'all': [{ 'fact': 'branch', 'operator': 'equal', 'value': 'develop' }] },
  'name': 'feat1',
  'event': { 'type': 'configuration', 'params': { 'key': 'feat1', 'value': 'value for DEVELOP' } },
};
let feat2_master = {
  'comment': 'Sample feature#2, rule for branch=MASTER,  without parameters',
  'conditions': { 'all': [{ 'fact': 'branch', 'operator': 'equal', 'value': 'master' }] },
  'name': 'feat2',
  'event': { 'type': 'configuration', 'params': { 'key': 'feat2', 'value': 'value for MASTER' } },
};
let feat3_default = {
  'comment': 'Sample feature#3, default value(any branch) everywhere',
  'conditions': { 'all': [{ 'fact': 'branch', 'operator': 'notEqual', 'value': '' }] },
  'name': 'feat3',
  'priority': 1000,
  'event': { 'type': 'configuration', 'params': { 'key': 'feat3', 'value': 'default value' } },
};
let feat3_master_prio100 = {
  'comment': 'Sample feature#3, value to be used in branch=MASTER, prio=100',
  'conditions': { 'all': [{ 'fact': 'branch', 'operator': 'equal', 'value': 'master' }] },
  'name': 'feat3',
  'priority': 100,
  'event': { 'type': 'configuration', 'params': { 'key': 'feat3', 'value': 'value for MASTER, priority=100' } },
};
let feat3_master_prio10 = {
  'comment': 'Sample feature#3, value to be used in branch=MASTER, prio=10',
  'conditions': { 'all': [{ 'fact': 'branch', 'operator': 'equal', 'value': 'master' }] },
  'name': 'feat3',
  'priority': 10,
  'event': { 'type': 'configuration', 'params': { 'key': 'feat3', 'value': 'value for MASTER, priority=10' } },
};
let feat3_master_prio15 = {
  'comment': 'Sample feature#3, value to be used in branch=MASTER, prio=15',
  'conditions': { 'all': [{ 'fact': 'branch', 'operator': 'equal', 'value': 'master' }] },
  'name': 'feat3',
  'priority': 15,
  'event': { 'type': 'configuration', 'params': { 'key': 'feat3', 'value': 'value for MASTER, priority=15' } },
};
let feat4_without_any_conditions = {
  'comment': 'Sample feature#4, value to be used anywhere',
  'conditions': { 'all': [] },
  'name': 'feat4',
  'priority': 15,
  'event': { 'type': 'configuration', 'params': { 'key': 'feat4', 'value': 'feat4_value' } },
};


describe('FeatureFlagEngine', () => {
  let engine;
  beforeEach(() => {
    engine = new FeatureFlagEngine();
  });

  describe('#evaluateRules', () => {
    it('should not match anything if rules are empty', async () => {
      let rules = [];
      await engine.evaluateRules(rules, 'staging', 'dummy'); //empty rules should work too
      expect(engine.getFeatureFlag('dummy feature')).to.be.undefined;
    });

    it('should not match anything if rules exist but conditions are not met', async () => {
      let rules = [feat1_develop];  //rule should match only if branch=develop
      await engine.evaluateRules(rules, 'staging', 'dummy'); //branch=staging
      expect(engine.getFeatureFlag('feat1')).to.be.undefined;
    });


    it('should not fail if provided branch name or environment are undefined', async () => {
      let rules = [feat1_develop];
      await engine.evaluateRules(rules, undefined, undefined); //undefined should be replaced with 'undefined' and treated as string
      expect(engine.getFeatureFlag('feat1')).to.be.undefined;
    });

    it('should match rule when branch in rule condition is same as requested', async () => {
      let rules = [feat1_develop, feat2_master];  //feat1 only if branch=develop, feat2 only if branch=maater
      await engine.evaluateRules(rules, 'develop', 'dummy'); //branch=develop
      expect(engine.getFeatureFlag('feat1')).to.be.equal(feat1_develop.event.params.value);
      expect(engine.getFeatureFlag('feat2')).to.be.undefined;

      await engine.evaluateRules(rules, 'master', 'dummy'); //branch=master
      expect(engine.getFeatureFlag('feat1')).to.be.undefined;
      expect(engine.getFeatureFlag('feat2')).to.be.equal(feat2_master.event.params.value);
    });


    it('should use rule with lower priority in case few rules match for the same featureId', async () => {
      //rules should be executed from the highest priority to the lowest
      //this means that in case there are two rules for same feature, more important is one with lower priority
      //as it will overwrite any previous rules
      let rules = [feat3_default, feat3_master_prio10, feat3_master_prio100, feat3_master_prio15];
      await engine.evaluateRules(rules, 'master', 'dummy'); //branch=master
      expect(engine.getFeatureFlag('feat3')).to.be.equal(feat3_master_prio10.event.params.value); //lowest priority should take precedence

      await engine.evaluateRules(rules, 'feature_branch', 'dummy'); //branch=feature_branch (not explicitely speficied in rules
      expect(engine.getFeatureFlag('feat3')).to.be.equal(feat3_default.event.params.value); //lowest priority should take precedence
    });


    it('should retrieve rule without any conditions', async () => {
      let rules = [feat4_without_any_conditions];
      await engine.evaluateRules(rules, undefined, undefined); //undefined should be replaced with 'undefined' and treated as string
      expect(engine.getFeatureFlag('feat4')).to.be.equal('feat4_value');

      await engine.evaluateRules(rules, 'develop', undefined);
      expect(engine.getFeatureFlag('feat4')).to.be.equal('feat4_value');
    });
  });
});
