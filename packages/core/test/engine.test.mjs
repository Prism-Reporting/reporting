import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveReport, validateReportSpec, getWidgetGroupIds } from '../dist/index.js';

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

function createBarChartSpec(height = '260px') {
  return {
    id: 'projects-bar',
    title: 'Projects Bar',
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
        type: 'barChart',
        id: 'projects-bar',
        title: 'Projects by progress',
        dataSource: 'projects',
        height,
        config: {
          categoryKey: 'name',
          valueKey: 'percentComplete',
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

  it('rejects undersized absolute chart heights in validation', () => {
    const validation = validateReportSpec(createBarChartSpec('200px'), {
      availableQueries: ['projects'],
      availableFields: {
        projects: ['name', 'percentComplete'],
      },
    });

    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('\n'), /smaller than the minimum 260px/);
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

  it('preserves paginated query metadata from the data provider', async () => {
    const spec = {
      id: 'projects-table',
      title: 'Projects',
      layout: 'singleColumn',
      dataSources: {
        projects: {
          name: 'projects',
          query: 'projects',
          delivery: { mode: 'paginatedList', pageSize: 20 },
        },
      },
      filters: [],
      widgets: [
        {
          type: 'table',
          id: 'projects-table',
          dataSource: 'projects',
          config: {
            columns: [{ key: 'id', label: 'Id' }],
          },
        },
      ],
    };

    const resolved = await resolveReport(spec, {
      async runQuery() {
        return {
          data: [{ id: 'p-21' }, { id: 'p-22' }],
          pagination: {
            page: 2,
            pageSize: 20,
            totalCount: 42,
            hasMore: true,
          },
        };
      },
    });

    assert.deepEqual(resolved.queries[0].pagination, {
      page: 2,
      pageSize: 20,
      totalCount: 42,
      totalPages: 3,
      hasMore: true,
    });
    assert.equal(resolved.queries[0].rowCount, 2);
  });

  it('passes explicit execution metadata to the data provider', async () => {
    let capturedRequest = null;
    await resolveReport(
      {
        id: 'projects-table',
        title: 'Projects',
        layout: 'singleColumn',
        dataSources: {
          projects: {
            name: 'projects',
            query: 'projects',
            delivery: { mode: 'paginatedList', pageSize: 25 },
          },
        },
        filters: [],
        widgets: [
          {
            type: 'table',
            id: 'projects-table',
            dataSource: 'projects',
            config: {
              columns: [{ key: 'name', label: 'Project' }],
            },
          },
        ],
      },
      {
        async runQuery(request) {
          capturedRequest = request;
          return {
            kind: 'rows',
            data: [{ name: 'Program Atlas' }],
            pagination: {
              page: 1,
              pageSize: 25,
              totalCount: 1,
            },
          };
        },
      }
    );

    assert.deepEqual(capturedRequest.execution, {
      deliveryMode: 'paginatedList',
      pageSize: 25,
    });
  });

  it('applies scoped filters only to widgets in the matching group', async () => {
    const captured = [];
    const spec = {
      id: 'projects-groups',
      title: 'Projects Groups',
      layout: 'singleColumn',
      dataSources: {
        shared: {
          name: 'shared',
          query: 'projects',
        },
      },
      filters: [
        {
          type: 'select',
          id: 'status',
          label: 'Status',
          dataSource: 'shared',
          options: [{ value: 'Active', label: 'Active' }],
        },
        {
          type: 'search',
          id: 'projectSearch',
          label: 'Project search',
          dataSource: 'shared',
          groupIds: ['details'],
          placeholder: 'Search projects',
        },
      ],
      groups: [
        {
          id: 'details',
          label: 'Details',
          widgetIds: ['projects-table'],
        },
      ],
      widgets: [
        {
          type: 'table',
          id: 'projects-table',
          title: 'Projects table',
          dataSource: 'shared',
          config: {
            columns: [{ key: 'id', label: 'Id' }],
          },
        },
        {
          type: 'kpi',
          id: 'projects-kpi',
          title: 'Projects KPI',
          dataSource: 'shared',
          config: {
            valueKey: '_count',
          },
        },
      ],
    };

    const resolved = await resolveReport(
      spec,
      {
        async runQuery(request) {
          captured.push(request);
          return [{ id: 'p-1' }];
        },
      },
      {
        status: 'Active',
        projectSearch: 'atlas',
      }
    );

    assert.equal(captured.length, 2);
    assert.deepEqual(captured[0].params, {
      status: 'Active',
      projectSearch: 'atlas',
    });
    assert.deepEqual(captured[1].params, {
      status: 'Active',
    });
    assert.equal(resolved.queries[0].widgetId, 'projects-table');
    assert.equal(resolved.queries[1].widgetId, 'projects-kpi');
  });

  it('treats tabs and sections as implicit filter groups', () => {
    const spec = {
      id: 'projects-tabs',
      title: 'Projects Tabs',
      layout: 'singleColumn',
      dataSources: {
        shared: {
          name: 'shared',
          query: 'projects',
        },
      },
      filters: [],
      widgets: [
        {
          type: 'table',
          id: 'projects-table',
          dataSource: 'shared',
          config: {
            columns: [{ key: 'id', label: 'Id' }],
          },
        },
      ],
      tabs: [
        {
          id: 'planning',
          label: 'Planning',
          groupIds: ['roadmap'],
          widgetIds: ['projects-table'],
        },
      ],
      sections: [
        {
          id: 'pipeline',
          title: 'Pipeline',
          groupIds: ['delivery'],
          widgetIds: ['projects-table'],
        },
      ],
    };

    assert.deepEqual(
      getWidgetGroupIds(spec, 'projects-table').sort(),
      ['delivery', 'pipeline', 'planning', 'roadmap']
    );
  });

  it('preserves explicit limitExceeded responses for full visuals', async () => {
    const resolved = await resolveReport(
      createBarChartSpec(),
      {
        async runQuery() {
          return {
            kind: 'limitExceeded',
            totalCount: 1400,
            limit: 1000,
          };
        },
      }
    );

    assert.equal(resolved.queries[0].deliveryMode, 'fullVisual');
    assert.deepEqual(resolved.queries[0].limitExceeded, {
      totalCount: 1400,
      limit: 1000,
    });
  });
});
