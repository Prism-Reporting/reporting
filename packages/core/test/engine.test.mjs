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
  it('accepts KPI aggregation config when the source field exists', () => {
    const validation = validateReportSpec(
      {
        id: 'projects-budget-kpi',
        title: 'Budget KPI',
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
            id: 'total-budget-spend',
            title: 'Total Budget Spend',
            dataSource: 'projects',
            config: {
              valueKey: 'budgetSpent',
              aggregation: { op: 'sum', key: 'budgetSpent' },
              format: 'currency',
              currencyCode: 'USD',
              decimalPlaces: 0,
              prefix: '~',
              suffix: ' total',
            },
          },
        ],
      },
      {
        availableQueries: ['projects'],
        availableFields: {
          projects: ['id', 'budgetSpent'],
        },
      }
    );

    assert.equal(validation.valid, true);
  });

  it('rejects KPI aggregation keys that are missing from the query contract', () => {
    const validation = validateReportSpec(
      {
        id: 'projects-budget-kpi-invalid',
        title: 'Budget KPI',
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
            id: 'total-budget-spend',
            title: 'Total Budget Spend',
            dataSource: 'projects',
            config: {
              valueKey: 'budgetSpent',
              aggregation: { op: 'sum', key: 'budgetSpend' },
            },
          },
        ],
      },
      {
        availableQueries: ['projects'],
        availableFields: {
          projects: ['id', 'budgetSpent'],
        },
      }
    );

    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('\n'), /budgetSpend/);
  });

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

  it('aggregates KPI values across the full result set', async () => {
    const resolved = await resolveReport(
      {
        id: 'projects-budget-kpi-runtime',
        title: 'Budget KPI',
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
            id: 'total-budget-spend',
            title: 'Total Budget Spend',
            dataSource: 'projects',
            config: {
              valueKey: 'budgetSpent',
              aggregation: { op: 'sum', key: 'budgetSpent' },
              format: 'currency',
              currencyCode: 'USD',
              decimalPlaces: 0,
              prefix: '~',
              suffix: ' total',
            },
          },
        ],
      },
      {
        async runQuery() {
          return [
            { id: 'p-1', budgetSpent: 1200 },
            { id: 'p-2', budgetSpent: 800 },
            { id: 'p-3', budgetSpent: 250 },
          ];
        },
      }
    );

    assert.equal(resolved.widgets[0].data.type, 'kpi');
    assert.deepEqual(resolved.widgets[0].data.data, {
      value: 2250,
      format: 'currency',
      currencyCode: 'USD',
      decimalPlaces: 0,
      prefix: '~',
      suffix: ' total',
    });
  });

  it('accepts summary-only table configs and validates summary fields', () => {
    const validation = validateReportSpec(
      {
        id: 'milestone-summary',
        title: 'Milestone Summary',
        layout: 'singleColumn',
        dataSources: {
          milestones: {
            name: 'milestones',
            query: 'projectMilestones',
          },
        },
        filters: [],
        widgets: [
          {
            type: 'table',
            id: 'milestone-summary',
            title: 'Milestone Summary',
            dataSource: 'milestones',
            config: {
              groupByKey: 'projectId',
              summary: [
                { key: 'milestoneName', op: 'distinct' },
                { key: 'completionDate', op: 'latest' },
                { key: 'budgetSpent', op: 'sum' },
              ],
            },
          },
        ],
      },
      {
        availableQueries: ['projectMilestones'],
        availableFields: {
          projectMilestones: ['projectId', 'milestoneName', 'completionDate', 'budgetSpent'],
        },
      }
    );

    assert.equal(validation.valid, true);
  });

  it('rejects grouped summaries on paginated table data sources', () => {
    const validation = validateReportSpec(
      {
        id: 'milestone-summary-paginated',
        title: 'Milestone Summary',
        layout: 'singleColumn',
        dataSources: {
          milestones: {
            name: 'milestones',
            query: 'projectMilestones',
            delivery: { mode: 'paginatedList', pageSize: 25 },
          },
        },
        filters: [],
        widgets: [
          {
            type: 'table',
            id: 'milestone-summary',
            dataSource: 'milestones',
            config: {
              groupByKey: 'projectId',
              summary: [{ key: 'completionDate', op: 'latest' }],
            },
          },
        ],
      },
      {
        availableQueries: ['projectMilestones'],
        availableFields: {
          projectMilestones: ['projectId', 'completionDate'],
        },
      }
    );

    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('\n'), /paginatedList/);
  });

  it('resolves grouped summary rows with derived columns and date-aware latest reducers', async () => {
    const resolved = await resolveReport(
      {
        id: 'milestone-summary-runtime',
        title: 'Milestone Summary',
        layout: 'singleColumn',
        dataSources: {
          milestones: {
            name: 'milestones',
            query: 'projectMilestones',
          },
        },
        filters: [],
        widgets: [
          {
            type: 'table',
            id: 'milestone-summary',
            title: 'Milestone Summary',
            dataSource: 'milestones',
            config: {
              groupByKey: 'projectId',
              summary: [
                { key: 'milestoneName', op: 'distinct' },
                { key: 'completionDate', op: 'latest' },
                { key: 'budgetSpent', op: 'sum' },
              ],
            },
          },
        ],
      },
      {
        async runQuery() {
          return [
            {
              projectId: 'p-1',
              milestoneName: 'Design',
              completionDate: '2026-03-01T00:30:00+05:00',
              budgetSpent: 250,
            },
            {
              projectId: 'p-1',
              milestoneName: 'Launch',
              completionDate: '2026-02-28T20:00:00Z',
              budgetSpent: 400,
            },
            {
              projectId: 'p-1',
              milestoneName: 'Design',
              completionDate: '2026-02-20T10:00:00Z',
              budgetSpent: 50,
            },
            {
              projectId: 'p-2',
              milestoneName: 'Kickoff',
              completionDate: '2026-01-15',
              budgetSpent: 100,
            },
          ];
        },
      }
    );

    assert.equal(resolved.widgets[0].data.type, 'table');
    assert.deepEqual(resolved.widgets[0].data.data.columns, [
      { key: 'projectId', label: 'Project Id' },
      { key: 'milestoneName', label: 'Milestone Name' },
      { key: 'completionDate', label: 'Completion Date' },
      { key: 'budgetSpent', label: 'Budget Spent' },
    ]);
    assert.deepEqual(resolved.widgets[0].data.data.rows, [
      {
        projectId: 'p-1',
        milestoneName: ['Design', 'Launch'],
        completionDate: '2026-02-28T20:00:00Z',
        budgetSpent: 700,
      },
      {
        projectId: 'p-2',
        milestoneName: ['Kickoff'],
        completionDate: '2026-01-15',
        budgetSpent: 100,
      },
    ]);
    assert.equal(resolved.widgets[0].data.data.groups, undefined);
  });

  it('accepts card views on paginated data sources and validates referenced fields', () => {
    const validation = validateReportSpec(
      {
        id: 'portfolio-cards',
        title: 'Portfolio Cards',
        layout: 'singleColumn',
        dataSources: {
          projects: {
            name: 'projects',
            query: 'projects',
            delivery: { mode: 'paginatedList', pageSize: 12 },
          },
        },
        filters: [],
        widgets: [
          {
            type: 'cardView',
            id: 'portfolio-cards',
            dataSource: 'projects',
            config: {
              titleKey: 'name',
              subtitleKey: 'owner',
              badges: [{ key: 'status' }],
              metadata: [
                { key: 'phase', label: 'Phase' },
                { key: 'nextMilestone', label: 'Next milestone' },
              ],
              primaryMetric: {
                key: 'budgetSpent',
                label: 'Spend',
                format: 'currency',
                currencyCode: 'USD',
                decimalPlaces: 0,
              },
              template: 'compact',
            },
          },
        ],
      },
      {
        availableQueries: ['projects'],
        availableFields: {
          projects: ['name', 'owner', 'status', 'phase', 'nextMilestone', 'budgetSpent'],
        },
      }
    );

    assert.equal(validation.valid, true);
  });

  it('resolves card view rows with normalized labels and default template', async () => {
    const resolved = await resolveReport(
      {
        id: 'portfolio-cards-runtime',
        title: 'Portfolio Cards',
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
            type: 'cardView',
            id: 'portfolio-cards',
            title: 'Projects',
            dataSource: 'projects',
            config: {
              titleKey: 'name',
              subtitleKey: 'owner',
              badges: [{ key: 'status' }],
              metadata: [
                { key: 'phase' },
                { key: 'nextMilestone', label: 'Next milestone' },
              ],
              primaryMetric: {
                key: 'budgetSpent',
                label: 'Spend',
                format: 'currency',
                currencyCode: 'USD',
                decimalPlaces: 0,
              },
            },
          },
        ],
      },
      {
        async runQuery() {
          return [
            {
              name: 'Vendor Portal',
              owner: 'Operations',
              status: 'At Risk',
              phase: 'Build',
              nextMilestone: 'Pilot readiness',
              budgetSpent: 125000,
            },
          ];
        },
      }
    );

    assert.equal(resolved.widgets[0].data.type, 'cardView');
    assert.deepEqual(resolved.widgets[0].data.data, {
      rows: [
        {
          name: 'Vendor Portal',
          owner: 'Operations',
          status: 'At Risk',
          phase: 'Build',
          nextMilestone: 'Pilot readiness',
          budgetSpent: 125000,
        },
      ],
      titleKey: 'name',
      subtitleKey: 'owner',
      badges: [{ key: 'status', label: 'Status' }],
      metadata: [
        { key: 'phase', label: 'Phase' },
        { key: 'nextMilestone', label: 'Next milestone' },
      ],
      primaryMetric: {
        key: 'budgetSpent',
        label: 'Spend',
        format: 'currency',
        currencyCode: 'USD',
        decimalPlaces: 0,
      },
      template: 'detailed',
    });
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
