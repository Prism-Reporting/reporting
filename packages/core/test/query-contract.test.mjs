import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createContractEnforcedDataProvider,
  defineQueryCatalog,
  formatBaseReportingContextForAgent,
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

  it('preserves optional semantic metadata and formats it for agent grounding', () => {
    const catalog = defineQueryCatalog([
      {
        name: 'projects',
        description: 'Project list',
        fieldShape: {
          status: {
            type: 'string',
            semantic: {
              kind: 'dimension',
              filterable: true,
              preferredWidgetRoles: ['category'],
              exampleValues: ['NEW', 'DONE'],
            },
          },
          budget: {
            type: 'number',
            semantic: {
              kind: 'measure',
              aggregatable: true,
              preferredWidgetRoles: ['value'],
            },
          },
        },
        paramShape: {
          status: {
            type: 'string[]',
            optional: true,
            semantic: {
              mapsToField: 'status',
              mode: 'multi',
              exampleValues: ['NEW', 'DONE'],
            },
          },
        },
      },
    ]);

    assert.equal(catalog.queries[0].fieldShape.status.semantic.kind, 'dimension');
    assert.equal(catalog.queries[0].paramShape.status.semantic.mapsToField, 'status');

    const text = formatBaseReportingContextForAgent({
      source: 'test',
      queries: catalog.queries,
    });

    assert.match(text, /Field details:/);
    assert.match(text, /status \(string\); kind=dimension; filterable; roles=category; examples="NEW", "DONE"/);
    assert.match(text, /Param details:/);
    assert.match(text, /status \(string\[\], optional\); mapsTo=status; mode=multi; examples="NEW", "DONE"/);
  });
});
