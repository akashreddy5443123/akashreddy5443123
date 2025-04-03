// seed-script.cjs - CommonJS script
const tsNode = require('ts-node');

tsNode.register({
  project: './tsconfig.seed.json',
  transpileOnly: true
});

require('./scripts/seed.ts');