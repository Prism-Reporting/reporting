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

function createSpiralChartSpec() {
  return {
    id: 'projects-spiral',
    title: 'Projects Spiral',
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
        type: 'spiralChart',
        id: 'projects-spiral',
        title: 'Projects by intensity',
        dataSource: 'projects',
        config: {
          categoryKey: 'name',
          valueKey: 'score',
        },
      },
    ],
  };
}

function createBubbleChartSpec() {
  return {
    id: 'projects-bubble',
    title: 'Projects Bubble',
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
        type: 'bubbleChart',
        id: 'projects-bubble',
        title: 'Projects by health',
        dataSource: 'projects',
        config: {
          xKey: 'budgetVariance',
          yKey: 'scheduleVariance',
          zKey: 'teamSize',
          labelKey: 'name',
          seriesKey: 'portfolio',
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

  it('accepts spiral charts when referenced fields exist', () => {
    const validation = validateReportSpec(createSpiralChartSpec(), {
      availableQueries: ['projects'],
      availableFields: {
        projects: ['name', 'score'],
      },
    });

    assert.equal(validation.valid, true);
  });

  it('accepts bubble charts when the referenced fields exist', () => {
    const validation = validateReportSpec(createBubbleChartSpec(), {
      availableQueries: ['projects'],
      availableFields: {
        projects: ['name', 'portfolio', 'budgetVariance', 'scheduleVariance', 'teamSize'],
      },
    });

    assert.equal(validation.valid, true);
  });

  it('rejects bubble charts when zKey is missing from the query contract', () => {
    const validation = validateReportSpec(createBubbleChartSpec(), {
      availableQueries: ['projects'],
      availableFields: {
        projects: ['name', 'portfolio', 'budgetVariance', 'scheduleVariance'],
      },
    });

    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('\n'), /teamSize/);
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

  it('resolves spiral chart data with category and value keys', async () => {
    const resolved = await resolveReport(createSpiralChartSpec(), {
      async runQuery() {
        return [
          { name: 'Atlas', score: 84 },
          { name: 'Orion', score: 61 },
        ];
      },
    });

    assert.equal(resolved.widgets[0].data.type, 'spiralChart');
    assert.deepEqual(resolved.widgets[0].data.data, {
      categoryKey: 'name',
      valueKey: 'score',
      data: [
        { name: 'Atlas', score: 84 },
        { name: 'Orion', score: 61 },
      ],
    });
  });

  it('resolves bubble chart data with the expected key mapping', async () => {
    const resolved = await resolveReport(createBubbleChartSpec(), {
      async runQuery() {
        return [
          {
            name: 'Atlas',
            portfolio: 'Core Systems',
            budgetVariance: 4,
            scheduleVariance: 2,
            teamSize: 10,
          },
          {
            name: 'Orion',
            portfolio: 'Customer Growth',
            budgetVariance: -1,
            scheduleVariance: 5,
            teamSize: 18,
          },
        ];
      },
    });

    assert.equal(resolved.widgets[0].data.type, 'bubbleChart');
    assert.deepEqual(resolved.widgets[0].data.data, {
      xKey: 'budgetVariance',
      yKey: 'scheduleVariance',
      zKey: 'teamSize',
      labelKey: 'name',
      seriesKey: 'portfolio',
      data: [
        {
          name: 'Atlas',
          portfolio: 'Core Systems',
          budgetVariance: 4,
          scheduleVariance: 2,
          teamSize: 10,
        },
        {
          name: 'Orion',
          portfolio: 'Customer Growth',
          budgetVariance: -1,
          scheduleVariance: 5,
          teamSize: 18,
        },
      ],
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

  it('accepts grouped raw tables with groupAggregations when referenced fields exist', () => {
    const validation = validateReportSpec(
      {
        id: 'budget-subtotals',
        title: 'Budget Subtotals',
        layout: 'singleColumn',
        dataSources: {
          initiatives: {
            name: 'initiatives',
            query: 'initiatives',
          },
        },
        filters: [],
        widgets: [
          {
            type: 'table',
            id: 'initiative-budget-table',
            dataSource: 'initiatives',
            config: {
              groupByKey: 'project',
              columns: [
                { key: 'owner', label: 'Owner' },
                { key: 'budget', label: 'Budget' },
              ],
              groupAggregations: [{ key: 'budget', op: 'sum' }],
              aggregations: [{ key: 'budget', op: 'sum' }],
            },
          },
        ],
      },
      {
        availableQueries: ['initiatives'],
        availableFields: {
          initiatives: ['project', 'owner', 'budget'],
        },
      }
    );

    assert.equal(validation.valid, true);
  });

  it('accepts valid table and card conditional formatting rules', () => {
    const validation = validateReportSpec(
      {
        id: 'conditional-formatting-valid',
        title: 'Conditional Formatting',
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
            type: 'table',
            id: 'projects-table',
            dataSource: 'projects',
            config: {
              columns: [
                { key: 'name', label: 'Project' },
                { key: 'budget', label: 'Budget' },
                { key: 'status', label: 'Status' },
              ],
              conditionalFormatting: [
                {
                  target: { type: 'row' },
                  when: { field: 'status', op: 'eq', value: 'At Risk' },
                  tone: 'danger',
                },
                {
                  target: { type: 'cell', columnKey: 'budget' },
                  when: { field: 'budget', op: 'between', min: 100, max: 200 },
                  tone: 'warning',
                },
              ],
            },
          },
          {
            type: 'cardView',
            id: 'projects-cards',
            dataSource: 'projects',
            config: {
              titleKey: 'name',
              conditionalFormatting: [
                {
                  target: { type: 'card' },
                  when: { field: 'status', op: 'in', values: ['At Risk', 'Blocked'] },
                  tone: 'danger',
                },
              ],
            },
          },
        ],
      },
      {
        availableQueries: ['projects'],
        availableFields: {
          projects: ['name', 'budget', 'status'],
        },
      }
    );

    assert.equal(validation.valid, true);
  });

  it('rejects invalid conditional formatting rules', () => {
    const validation = validateReportSpec(
      {
        id: 'conditional-formatting-invalid',
        title: 'Conditional Formatting',
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
            type: 'table',
            id: 'projects-table',
            dataSource: 'projects',
            config: {
              columns: [
                { key: 'name', label: 'Project' },
                { key: 'budget', label: 'Budget' },
              ],
              conditionalFormatting: [
                {
                  target: { type: 'cell', columnKey: 'spend' },
                  when: { field: 'budgetAmount', op: 'between', min: 100 },
                  tone: 'loud',
                },
              ],
            },
          },
        ],
      },
      {
        availableQueries: ['projects'],
        availableFields: {
          projects: ['name', 'budget'],
        },
      }
    );

    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('\n'), /budgetAmount/);
    assert.match(validation.errors.join('\n'), /columnKey "spend"/);
    assert.match(validation.errors.join('\n'), /tone must be one of/);
    assert.match(validation.errors.join('\n'), /requires a string or number max/);
  });

  it('rejects groupAggregations when groupByKey is missing', () => {
    const validation = validateReportSpec(
      {
        id: 'budget-subtotals-invalid',
        title: 'Budget Subtotals',
        layout: 'singleColumn',
        dataSources: {
          initiatives: {
            name: 'initiatives',
            query: 'initiatives',
          },
        },
        filters: [],
        widgets: [
          {
            type: 'table',
            id: 'initiative-budget-table',
            dataSource: 'initiatives',
            config: {
              columns: [
                { key: 'owner', label: 'Owner' },
                { key: 'budget', label: 'Budget' },
              ],
              groupAggregations: [{ key: 'budget', op: 'sum' }],
            },
          },
        ],
      },
      {
        availableQueries: ['initiatives'],
        availableFields: {
          initiatives: ['owner', 'budget'],
        },
      }
    );

    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('\n'), /groupByKey/);
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

  it('resolves grouped raw rows with subtotal rows and grand total labels', async () => {
    const resolved = await resolveReport(
      {
        id: 'initiative-budget-runtime',
        title: 'Initiative Budget Runtime',
        layout: 'singleColumn',
        dataSources: {
          initiatives: {
            name: 'initiatives',
            query: 'initiatives',
          },
        },
        filters: [],
        widgets: [
          {
            type: 'table',
            id: 'initiative-budget-table',
            title: 'Initiatives',
            dataSource: 'initiatives',
            config: {
              groupByKey: 'project',
              groupLabelKey: 'projectLabel',
              columns: [
                { key: 'owner', label: 'Owner' },
                { key: 'budget', label: 'Budget' },
                { key: 'spent', label: 'Spent' },
              ],
              groupAggregations: [
                { key: 'budget', op: 'sum' },
                { key: 'spent', op: 'sum' },
              ],
              groupSummaryLabel: 'Project subtotal',
              aggregations: [
                { key: 'budget', op: 'sum' },
                { key: 'spent', op: 'sum' },
              ],
              grandTotalLabel: 'Grand total budget',
            },
          },
        ],
      },
      {
        async runQuery() {
          return [
            { project: 'atlas', projectLabel: 'Atlas Program', owner: 'Alice', budget: 120, spent: 80 },
            { project: 'atlas', projectLabel: 'Atlas Program', owner: 'Bob', budget: 90, spent: 60 },
            { project: 'orion', projectLabel: 'Orion Revamp', owner: 'Carol', budget: 140, spent: 92 },
          ];
        },
      }
    );

    assert.equal(resolved.widgets[0].data.type, 'table');
    assert.equal(resolved.widgets[0].data.data.groupSummaryLabel, 'Project subtotal');
    assert.equal(resolved.widgets[0].data.data.footerLabel, 'Grand total budget');
    assert.equal(resolved.widgets[0].data.data.groups.length, 2);
    assert.deepEqual(resolved.widgets[0].data.data.groups[0].summaryRow, {
      budget: 210,
      spent: 140,
    });
    assert.deepEqual(resolved.widgets[0].data.data.footer, {
      budget: 350,
      spent: 232,
    });
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

  it('passes conditional formatting through resolved table and card data', async () => {
    const resolved = await resolveReport(
      {
        id: 'conditional-formatting-runtime',
        title: 'Conditional Formatting Runtime',
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
            type: 'table',
            id: 'projects-table',
            dataSource: 'projects',
            config: {
              columns: [
                { key: 'name', label: 'Project' },
                { key: 'budget', label: 'Budget' },
                { key: 'status', label: 'Status' },
              ],
              conditionalFormatting: [
                {
                  target: { type: 'row' },
                  when: { field: 'status', op: 'eq', value: 'At Risk' },
                  tone: 'danger',
                  label: 'Escalation',
                },
                {
                  target: { type: 'cell', columnKey: 'budget' },
                  when: { field: 'budget', op: 'gt', value: 100 },
                  tone: 'warning',
                },
              ],
            },
          },
          {
            type: 'cardView',
            id: 'projects-cards',
            dataSource: 'projects',
            config: {
              titleKey: 'name',
              conditionalFormatting: [
                {
                  target: { type: 'card' },
                  when: { field: 'status', op: 'in', values: ['At Risk'] },
                  tone: 'danger',
                  label: 'At-risk card',
                },
              ],
            },
          },
        ],
      },
      {
        async runQuery() {
          return [
            { name: 'Atlas', budget: 120, status: 'At Risk' },
            { name: 'Orion', budget: 80, status: 'On Track' },
          ];
        },
      }
    );

    assert.equal(resolved.widgets[0].data.type, 'table');
    assert.deepEqual(resolved.widgets[0].data.data.conditionalFormatting, [
      {
        target: { type: 'row' },
        when: { field: 'status', op: 'eq', value: 'At Risk' },
        tone: 'danger',
        label: 'Escalation',
      },
      {
        target: { type: 'cell', columnKey: 'budget' },
        when: { field: 'budget', op: 'gt', value: 100 },
        tone: 'warning',
      },
    ]);

    assert.equal(resolved.widgets[1].data.type, 'cardView');
    assert.deepEqual(resolved.widgets[1].data.data.conditionalFormatting, [
      {
        target: { type: 'card' },
        when: { field: 'status', op: 'in', values: ['At Risk'] },
        tone: 'danger',
        label: 'At-risk card',
      },
    ]);
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

  it('accepts timelineView configs when the referenced fields exist', () => {
    const validation = validateReportSpec(
      {
        id: 'project-timeline',
        title: 'Project Timeline',
        layout: 'singleColumn',
        dataSources: {
          milestones: {
            name: 'milestones',
            query: 'milestones',
          },
        },
        filters: [],
        widgets: [
          {
            type: 'timelineView',
            id: 'timeline',
            title: 'Milestones',
            dataSource: 'milestones',
            config: {
              startDateKey: 'startDate',
              endDateKey: 'endDate',
              labelKey: 'name',
              groupKey: 'project',
              statusKey: 'status',
            },
          },
        ],
      },
      {
        availableQueries: ['milestones'],
        availableFields: {
          milestones: ['id', 'name', 'startDate', 'endDate', 'project', 'status'],
        },
      }
    );

    assert.equal(validation.valid, true);
  });

  it('rejects summary delivery for gantt charts', () => {
    const validation = validateReportSpec(
      {
        id: 'project-gantt',
        title: 'Project Gantt',
        layout: 'singleColumn',
        dataSources: {
          milestones: {
            name: 'milestones',
            query: 'milestones',
            delivery: {
              mode: 'summary',
            },
          },
        },
        filters: [],
        widgets: [
          {
            type: 'ganttChart',
            id: 'timeline',
            title: 'Milestones',
            dataSource: 'milestones',
            config: {
              startDateKey: 'startDate',
              endDateKey: 'endDate',
              labelKey: 'name',
            },
          },
        ],
      },
      {
        availableQueries: ['milestones'],
        availableFields: {
          milestones: ['name', 'startDate', 'endDate'],
        },
      }
    );

    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('\n'), /cannot use summary dataSource/);
  });

  it('normalizes timeline items to UTC ranges and assigns overlap lanes', async () => {
    const resolved = await resolveReport(
      {
        id: 'project-timeline-runtime',
        title: 'Project Timeline',
        layout: 'singleColumn',
        dataSources: {
          milestones: {
            name: 'milestones',
            query: 'milestones',
          },
        },
        filters: [],
        widgets: [
          {
            type: 'timelineView',
            id: 'timeline',
            title: 'Milestones',
            dataSource: 'milestones',
            config: {
              startDateKey: 'startDate',
              endDateKey: 'endDate',
              labelKey: 'name',
              groupKey: 'project',
              statusKey: 'status',
            },
          },
        ],
      },
      {
        async runQuery() {
          return [
            {
              id: 'm1',
              name: 'Design',
              project: 'Atlas',
              status: 'Done',
              startDate: '2025-03-01',
              endDate: '2025-03-10',
            },
            {
              id: 'm2',
              name: 'Implementation',
              project: 'Atlas',
              status: 'In Progress',
              startDate: '2025-03-05',
              endDate: '2025-03-20',
            },
            {
              id: 'm3',
              name: 'Go-live',
              project: 'Orion',
              status: 'Planned',
              startDate: '2025-03-22',
              endDate: '2025-03-22',
            },
          ];
        },
      }
    );

    assert.equal(resolved.widgets[0].data.type, 'timelineView');
    const timeline = resolved.widgets[0].data.data;
    assert.equal(timeline.groups.length, 2);
    assert.equal(timeline.groups[0].label, 'Atlas');
    assert.equal(timeline.groups[0].laneCount, 2);
    assert.equal(timeline.groups[0].items[0].lane, 0);
    assert.equal(timeline.groups[0].items[1].lane, 1);
    assert.equal(timeline.groups[1].items[0].endMs - timeline.groups[1].items[0].startMs, 86400000);
    assert.equal(timeline.rangeStartAt, '2025-03-01T00:00:00.000Z');
    assert.equal(timeline.rangeEndAt, '2025-03-23T00:00:00.000Z');
  });
});
