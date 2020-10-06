const { Engine, Rule } = require('json-rules-engine');
const GliderError = require('../error');
const { loadBreRules } = require('./model');
const config = require('../../config');

const BRE_TOPIC = 'featureFlag';  //which rules in BRE collection are related to feature flags


/**
 * Class to process and evaluate business rules and based on them creates an object with features and it's settings.
 *
 */
class FeatureFlagEngine {
  constructor () {
    this._features = undefined;   //lazy cache for rules
  }

  /**
   * Process business rules (provided as 'rules' parameter) using facts: 'branch' (github branch) and 'environment'.
   * The result should be an object with list of features (and it's values) that are supposed to be used in a given github branch and environment.
   * Thanks to that we can dynamicaly configure deployments (e.g. turn on certain feature in 'develop' branch and turn off in 'master' branch)
   * @param rules
   * @param branch
   * @param environment
   * @returns {Promise<any>}
   */
  async evaluateRules (rules, branch, environment) {
    if (!rules)
      rules = [];
    const ruleEngine = new Engine();
    rules.forEach(rec => {
      let rule = new Rule(rec);
      ruleEngine.addRule(rule);
    });
    const facts = { branch: branch ? branch : 'undefined', environment: environment ? environment : 'undefined' };
    let results = await ruleEngine.run(facts);
    this._features = {};
    results.events.forEach(event => {
      let { params: { key, value } } = event;
      this._features[key] = value;
    });
    return this._features;
  }

  ensureFeaturesWereLoaded () {
    if (!this._features) {
      throw new GliderError('Feature flags were not yet initialized!', 500);
    }
  }

  /**
   * Returns object with features and it's values for the current branch and environment.
   * Note: rules must be already evaluated, otherwise it will throw an exception
   * @returns {any}
   */
  getFeatureFlags () {
    this.ensureFeaturesWereLoaded();
    return JSON.parse(JSON.stringify(this._features));
  }

  /**
   * Returns value of a feature provided as parameter('featureFlagId') which should be used in the current branch and environment.
   * Note: rules must be already evaluated, otherwise it will throw an exception
   * @param featureFlagId
   * @returns {*}
   */
  getFeatureFlag (featureFlagId) {
    this.ensureFeaturesWereLoaded();
    return this._features[featureFlagId];
  }
}

let _engine;

/**
 * Helper function to initialize and return FeatureFlagEngine instance with already pre-loaded and evaluated business rules (loaded from Mongo collection)
 * @returns {Promise<FeatureFlagEngine>}
 */
const getFeatureFlagsEngine = async () => {
  if (!_engine) {
    console.log(`**************Initializing BRE ENGINE************, branch:${config.branch}, environment:${config.environment}`);
    let records = await loadBreRules(BRE_TOPIC);
    _engine = new FeatureFlagEngine();
    await _engine.evaluateRules(records, config.branch, config.environment);
  } else {
    console.log('Engine was already initialized');
  }
  return _engine;
};

/**
 * Helper function to return feature value (makes sure FeatureFlagEngine is already initialized and rules are evaluated)
 * @param featureId
 * @returns {Promise<*>}
 */
const getFeatureFlag = async (featureId) => {
  const e = await getFeatureFlagsEngine();
  return e.getFeatureFlag(featureId);
};

/**
 * Helper function to return all features(and it's values/configurations)
 * @param featureId
 * @returns {Promise<*>}
 */
const getFeatureFlags = async () => {
  const e = await getFeatureFlagsEngine();
  return e.getFeatureFlags();
};
module.exports = { FeatureFlagEngine, getFeatureFlag, getFeatureFlags };
