'use strict';

const handler = require('../../../lib/handler');

const VAULT_TABLE = 'vaultsNew';

module.exports.handler = handler(async () => {
  const cached = await db.scan(VAULT_TABLE);
  return cached;
});
