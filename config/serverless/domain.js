'use strict';

const _ = require('lodash');

const DEFAULT = {
  domainName: 'api.yearn.tools',
  certificateName: 'yearn.tools',
  stage: '${self:provider.stage}',
  createRoute53Record: true,
  basePath: '${self:custom.basePath}',
  endpointType: 'regional',
  apiType: 'rest',
  securityPolicy: 'tls_1_2',
  autoDomain: true,
  // allowPathMatching: true, // enable only once when migrating from rest to http api migration
};

module.exports.prod = () => DEFAULT;

module.exports.staging = () => {
  return _.merge({}, DEFAULT, {
    domainName: `staging-${DEFAULT.domainName}`,
  });
};

module.exports.dev = () => {
  return _.merge({}, DEFAULT, {
    domainName: `dev-${DEFAULT.domainName}`,
  });
};

module.exports.local = () => {
  return _.merge({}, DEFAULT, {
    domainName: `local-${DEFAULT.domainName}`,
  });
};
