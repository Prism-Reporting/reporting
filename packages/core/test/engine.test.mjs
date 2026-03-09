import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveReport, validateReportSpec } from '../dist/index.js';

function createKpiSpec(valueKey) {
  return {
    id: `projects-kpi-${valueKey}`,
    title: 'Projects KPI',
    layout: 'singleColumn',
    dataSources: {
      projects: {
        name: 'projects',
        query: 'projects',
      },
    },
    filters: [],
    widgets: [
      {
        type: 'kpi',
        id: 'projects-kpi',
        title: 'Projects',
        dataSource: 'projects',
        config: {
          valueKey,
          label: 'Total projects',
          format: 'number',
        },
      },
    ],
  };
}

describe('kpi validation parity', () => {
  it('accepts "_count" as a reserved KPI valueKey', () => {
    const validation = validateReportSpec(createKpiSpec('_count'), {
      availableQueries: ['projects'],
      availableFields: {
        projects: ['id', 'name', 'status'],
      },
    });

    assert.equal(validation.valid, true);
  });

  it('rejects unknown KPI field keys instead of treating them like counts', () => {
    const validation = validateReportSpec(createKpiSpec('budgetVarianc'), {
      availableQueries: ['projects'],
      availableFields: {
        projects: ['id', 'name', 'status', 'budgetVariance'],
      },
    });

    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('\n'), /budgetVarianc/);
  });

  it('resolves "_count" to the row count at runtime', async () => {
    const resolved = await resolveReport(createKpiSpec('_count'), {
      async runQuery() {
        return [{ id: 'p-1' }, { id: 'p-2' }, { id: 'p-3' }];
      },
    });

    assert.equal(resolved.widgets[0].data.type, 'kpi');
    assert.equal(resolved.widgets[0].data.data.value, 3);
  });

  it('does not fall back to row count for non-count KPI keys', async () => {
    const resolved = await resolveReport(createKpiSpec('budgetVarianc'), {
      async runQuery() {
        return [{ id: 'p-1' }, { id: 'p-2' }, { id: 'p-3' }];
      },
    });

    assert.equal(resolved.widgets[0].data.type, 'kpi');
    assert.equal(resolved.widgets[0].data.data.value, '');
  });
});
