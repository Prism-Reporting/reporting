import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createContractEnforcedDataProvider,
  defineQueryCatalog,
  validateQueryResultAgainstCatalog,
} from '../dist/index.js';

describe('query contracts', () => {
  it('infers fields and params from framework-owned contracts', () => {
    const catalog = defineQueryCatalog([
      {
        name: 'projectsSummary',
        fieldShape: {
          period: { type: 'string' },
          count: { type: 'number' },
        },
        paramShape: {
          status: { type: 'string', optional: true },
        },
      },
    ]);

    assert.deepEqual(catalog.queries[0].fields, ['period', 'count']);
    assert.deepEqual(catalog.queries[0].params, ['status']);
  });

  it('rejects query rows that do not match the declared field contract', () => {
    const catalog = defineQueryCatalog([
      {
        name: 'projectsSummary',
        fieldShape: {
          period: { type: 'string' },
          count: { type: 'number' },
        },
      },
    ]);

    assert.throws(
      () => validateQueryResultAgainstCatalog(catalog.queries, 'projectsSummary', {
        kind: 'rows',
        data: [{ period: 'overall', count: '100' }],
      }),
      /expected "number"/
    );
  });

  it('wraps data providers so contracts are enforced at runtime', async () => {
    const catalog = defineQueryCatalog([
      {
        name: 'projectsSummary',
        fieldShape: {
          period: { type: 'string' },
          count: { type: 'number' },
        },
      },
    ]);

    const provider = createContractEnforcedDataProvider(catalog.queries, {
      async runQuery() {
        return {
          kind: 'rows',
          data: [{ period: 'overall', count: '100' }],
        };
      },
    });

    await assert.rejects(
      () => provider.runQuery({ name: 'projectsSummary', execution: { deliveryMode: 'summary' } }),
      /expected "number"/
    );
  });
});