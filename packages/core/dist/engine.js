import { getWidgetSizeConstraints, } from "./types.js";
export const REPORT_SPEC_VERSION = "v1";
const KPI_COUNT_VALUE_KEY = "_count";
const DEFAULT_FULL_VISUAL_MAX_ROWS = 1000;
function parseCssSizeToPixels(value) {
    const trimmed = value.trim().toLowerCase();
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(px|rem|em)$/);
    if (!match)
        return null;
    const amount = Number(match[1]);
    if (!Number.isFinite(amount))
        return null;
    switch (match[2]) {
        case "px":
            return amount;
        case "rem":
        case "em":
            return amount * 16;
        default:
            return null;
    }
}
function getEffectiveDataSourceDelivery(dataSource) {
    if (dataSource.delivery?.mode === "paginatedList") {
        return {
            mode: "paginatedList",
            ...(dataSource.delivery.pageSize != null
                ? { pageSize: dataSource.delivery.pageSize }
                : dataSource.pagination?.pageSize != null
                    ? { pageSize: dataSource.pagination.pageSize }
                    : {}),
        };
    }
    if (dataSource.delivery?.mode === "fullVisual") {
        return {
            mode: "fullVisual",
            maxRows: dataSource.delivery.maxRows != null &&
                Number.isInteger(Number(dataSource.delivery.maxRows)) &&
                Number(dataSource.delivery.maxRows) > 0
                ? Number(dataSource.delivery.maxRows)
                : DEFAULT_FULL_VISUAL_MAX_ROWS,
        };
    }
    if (dataSource.delivery?.mode === "summary") {
        return { mode: "summary" };
    }
    if (dataSource.pagination?.pageSize != null && dataSource.pagination.pageSize > 0) {
        return { mode: "paginatedList", pageSize: dataSource.pagination.pageSize };
    }
    return { mode: "fullVisual", maxRows: DEFAULT_FULL_VISUAL_MAX_ROWS };
}
/**
 * Validates a ReportSpec for required fields and referential integrity.
 * When options.policy is provided, runs the policy check after structural validation; if the policy returns allowed: false, policy errors are added to diagnostics and valid is set to false.
 */
export function validateReportSpec(spec, context = {}, options) {
    const diagnostics = [];
    const queryLookup = new Set(context.availableQueries ?? []);
    const hasQueryContext = queryLookup.size > 0;
    const fieldLookup = Object.fromEntries(Object.entries(context.availableFields ?? {}).map(([query, fields]) => [
        query,
        new Set(fields),
    ]));
    const addError = (path, code, message, suggestion) => {
        diagnostics.push({
            path,
            code,
            message,
            severity: "error",
            suggestion,
        });
    };
    const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
    const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
    const validateFieldReference = (path, queryName, fieldName, label, options = {}) => {
        if (!isNonEmptyString(fieldName)) {
            addError(path, "missing-field-reference", `${label} must be a non-empty string`, "Provide a field key that exists in the referenced query output.");
            return;
        }
        if (options.allowSyntheticCount && fieldName === KPI_COUNT_VALUE_KEY) {
            return;
        }
        if (!queryName)
            return;
        const knownFields = fieldLookup[queryName];
        if (knownFields && !knownFields.has(fieldName)) {
            addError(path, "unknown-field-reference", `${label} "${fieldName}" is not available on query "${queryName}"`, "Use one of the fields exposed by the query catalog for this query.");
        }
    };
    const rawSpec = spec;
    if (!isRecord(rawSpec)) {
        addError("$", "invalid-report-spec", "ReportSpec must be an object", "Provide a JSON object that matches the ReportSpec contract.");
        return {
            version: REPORT_SPEC_VERSION,
            valid: false,
            errors: diagnostics.map((diagnostic) => diagnostic.message),
            diagnostics,
        };
    }
    if (!isNonEmptyString(rawSpec.id)) {
        addError("id", "missing-id", "ReportSpec.id is required", "Use a unique kebab-case report id.");
    }
    if (!isNonEmptyString(rawSpec.title)) {
        addError("title", "missing-title", "ReportSpec.title is required", "Provide a human-readable title.");
    }
    if (!isNonEmptyString(rawSpec.layout)) {
        addError("layout", "missing-layout", "ReportSpec.layout is required", 'Use "singleColumn" or "twoColumn".');
    }
    else if (!["singleColumn", "twoColumn"].includes(rawSpec.layout)) {
        addError("layout", "invalid-layout", `ReportSpec.layout "${rawSpec.layout}" is not supported`, 'Set layout to exactly "singleColumn" or "twoColumn" (lowercase, no spaces).');
    }
    const dataSources = isRecord(rawSpec.dataSources) ? rawSpec.dataSources : {};
    if (!isRecord(rawSpec.dataSources)) {
        addError("dataSources", "invalid-data-sources", "ReportSpec.dataSources must be an object", "Provide an object keyed by dataSource id.");
    }
    const filters = Array.isArray(rawSpec.filters) ? rawSpec.filters : [];
    if (!Array.isArray(rawSpec.filters)) {
        addError("filters", "invalid-filters", "ReportSpec.filters must be an array", "Provide an array of filter definitions.");
    }
    const widgets = Array.isArray(rawSpec.widgets) ? rawSpec.widgets : [];
    if (!Array.isArray(rawSpec.widgets)) {
        addError("widgets", "invalid-widgets", "ReportSpec.widgets must be an array", "Provide an array of widget definitions.");
    }
    const dataSourceNames = new Set();
    const dataSourceValueNames = new Set();
    const dataSourceQueries = new Map();
    for (const [dataSourceId, value] of Object.entries(dataSources)) {
        dataSourceNames.add(dataSourceId);
        if (!isRecord(value)) {
            addError(`dataSources.${dataSourceId}`, "invalid-data-source", `Data source "${dataSourceId}" must be an object`, "Provide { name, query, params? } for each data source.");
            continue;
        }
        if (!isNonEmptyString(value.name)) {
            addError(`dataSources.${dataSourceId}.name`, "missing-data-source-name", `Data source "${dataSourceId}" must define a non-empty name`, "Use a stable descriptive name for the data source.");
        }
        else if (dataSourceValueNames.has(value.name)) {
            addError(`dataSources.${dataSourceId}.name`, "duplicate-data-source-name", `Duplicate data source name "${value.name}"`, "Ensure every data source name is unique within the report.");
        }
        else {
            dataSourceValueNames.add(value.name);
        }
        if (!isNonEmptyString(value.query)) {
            addError(`dataSources.${dataSourceId}.query`, "missing-query", `Data source "${dataSourceId}" must define a non-empty query`, "Use a backend query identifier supported by the host.");
            continue;
        }
        dataSourceQueries.set(dataSourceId, value.query);
        if (hasQueryContext && !queryLookup.has(value.query)) {
            addError(`dataSources.${dataSourceId}.query`, "unknown-query", `Data source "${dataSourceId}" references unknown query "${value.query}"`, "Use one of the queries published by the host query catalog.");
        }
        if (value.params !== undefined && !isRecord(value.params)) {
            addError(`dataSources.${dataSourceId}.params`, "invalid-data-source-params", `Data source "${dataSourceId}" params must be an object`, "Provide static default params as a JSON object.");
        }
        const sortRaw = value.sort;
        if (sortRaw !== undefined) {
            const sortArr = Array.isArray(sortRaw) ? sortRaw : [sortRaw];
            for (const [i, item] of sortArr.entries()) {
                if (!isRecord(item) || !isNonEmptyString(item.key)) {
                    addError(`dataSources.${dataSourceId}.sort${Array.isArray(sortRaw) ? `.${i}.key` : ".key"}`, "invalid-sort-key", "Sort item key must be a non-empty string", "Use a row field key for sort.");
                }
                if (isRecord(item) && item.direction !== undefined && !["asc", "desc"].includes(String(item.direction))) {
                    addError(`dataSources.${dataSourceId}.sort${Array.isArray(sortRaw) ? `.${i}.direction` : ".direction"}`, "invalid-sort-direction", "Sort direction must be \"asc\" or \"desc\"", "Set direction to \"asc\" or \"desc\".");
                }
            }
        }
        if (value.limit !== undefined) {
            const n = Number(value.limit);
            if (!Number.isInteger(n) || n < 1) {
                addError(`dataSources.${dataSourceId}.limit`, "invalid-limit", "Data source limit must be a positive integer", "Set limit to a positive integer (e.g. 100).");
            }
        }
        const pagination = value.pagination;
        if (pagination !== undefined) {
            if (!isRecord(pagination)) {
                addError(`dataSources.${dataSourceId}.pagination`, "invalid-pagination", "Data source pagination must be an object", "Provide { pageSize: number, pageParamKey?: string }.");
            }
            else {
                const ps = pagination.pageSize;
                if (ps === undefined || !Number.isInteger(Number(ps)) || Number(ps) < 1) {
                    addError(`dataSources.${dataSourceId}.pagination.pageSize`, "invalid-pagination-pageSize", "pagination.pageSize must be a positive integer", "Set pageSize to a positive integer (e.g. 25).");
                }
            }
        }
        const delivery = value.delivery;
        if (delivery !== undefined) {
            if (!isRecord(delivery)) {
                addError(`dataSources.${dataSourceId}.delivery`, "invalid-delivery", "Data source delivery must be an object", 'Provide delivery as { mode: "paginatedList" | "fullVisual" | "summary", pageSize?, maxRows? }.');
            }
            else {
                const mode = delivery.mode;
                if (!isNonEmptyString(mode) || !["paginatedList", "fullVisual", "summary"].includes(mode)) {
                    addError(`dataSources.${dataSourceId}.delivery.mode`, "invalid-delivery-mode", 'Data source delivery.mode must be "paginatedList", "fullVisual", or "summary"', 'Set delivery.mode to exactly "paginatedList", "fullVisual", or "summary".');
                }
                if (delivery.pageSize !== undefined) {
                    const n = Number(delivery.pageSize);
                    if (!Number.isInteger(n) || n < 1) {
                        addError(`dataSources.${dataSourceId}.delivery.pageSize`, "invalid-delivery-pageSize", "delivery.pageSize must be a positive integer", "Set pageSize to a positive integer (e.g. 25).");
                    }
                }
                if (delivery.maxRows !== undefined) {
                    const n = Number(delivery.maxRows);
                    if (!Number.isInteger(n) || n < 1) {
                        addError(`dataSources.${dataSourceId}.delivery.maxRows`, "invalid-delivery-maxRows", "delivery.maxRows must be a positive integer", "Set maxRows to a positive integer (e.g. 1000).");
                    }
                }
            }
        }
    }
    const filterIds = new Set();
    for (const [index, filter] of filters.entries()) {
        const path = `filters.${index}`;
        if (!isRecord(filter)) {
            addError(path, "invalid-filter", `Filter at index ${index} must be an object`, "Replace this entry with a filter object with type, id, label, dataSource and type-specific fields (e.g. options for select).");
            continue;
        }
        const id = filter.id;
        if (!isNonEmptyString(id)) {
            addError(`${path}.id`, "missing-filter-id", `Filter at index ${index} is missing id`, "Add a unique string id for this filter (e.g. \"status\", \"dueDate\").");
        }
        else if (filterIds.has(id)) {
            addError(`${path}.id`, "duplicate-filter-id", `Duplicate filter id "${id}"`, "Give this filter a different id that is not used by any other filter in the report.");
        }
        else {
            filterIds.add(id);
        }
        if (!isNonEmptyString(filter.label)) {
            addError(`${path}.label`, "missing-filter-label", `Filter "${String(id ?? index)}" is missing label`, "Add a non-empty label string for this filter (e.g. \"Status\", \"Due Date\").");
        }
        const filterDataSources = getFilterDataSourceTargets(filter.dataSource);
        if (filterDataSources.length === 0 || filterDataSources.some((value) => !isNonEmptyString(value))) {
            addError(`${path}.dataSource`, "missing-filter-data-source", `Filter "${String(id ?? index)}" must reference a dataSource`, "Set dataSource to a dataSource id string or an array of dataSource id strings.");
        }
        else {
            for (const dataSourceRef of filterDataSources) {
                if (!dataSourceNames.has(dataSourceRef)) {
                    addError(`${path}.dataSource`, "unknown-filter-data-source", `Filter "${String(id ?? index)}" references unknown dataSource "${dataSourceRef}"`, "Change dataSource to a key that exists in ReportSpec.dataSources, or add a dataSource with that id.");
                }
            }
        }
        switch (filter.type) {
            case "select": {
                if (!Array.isArray(filter.options)) {
                    addError(`${path}.options`, "invalid-select-options", `Select filter "${String(id ?? index)}" must define an options array`, "Add an options array with at least one object: { value: \"...\", label: \"...\" }.");
                    break;
                }
                if (filter.options.length === 0) {
                    addError(`${path}.options`, "empty-select-options", `Select filter "${String(id ?? index)}" has an empty options array`, "Add at least one option to the options array, e.g. { value: \"NEW\", label: \"New\" }.");
                    break;
                }
                for (const [optionIndex, option] of filter.options.entries()) {
                    if (!isRecord(option)) {
                        addError(`${path}.options.${optionIndex}`, "invalid-select-option", "Select filter options must be objects", "Provide { value, label } for each option.");
                        continue;
                    }
                    if (!isNonEmptyString(option.value)) {
                        addError(`${path}.options.${optionIndex}.value`, "missing-select-option-value", "Select filter option value must be a non-empty string", "Provide the value passed to the backend query.");
                    }
                    if (!isNonEmptyString(option.label)) {
                        addError(`${path}.options.${optionIndex}.label`, "missing-select-option-label", "Select filter option label must be a non-empty string", "Provide the label shown in the UI.");
                    }
                }
                break;
            }
            case "multiSelect": {
                if (!Array.isArray(filter.options)) {
                    addError(`${path}.options`, "invalid-multiSelect-options", `MultiSelect filter "${String(id ?? index)}" must define an options array`, "Add an options array with at least one object: { value: \"...\", label: \"...\" }.");
                    break;
                }
                if (filter.options.length === 0) {
                    addError(`${path}.options`, "empty-multiSelect-options", `MultiSelect filter "${String(id ?? index)}" has an empty options array`, "Add at least one option to the options array, e.g. { value: \"NEW\", label: \"New\" }.");
                    break;
                }
                for (const [optionIndex, option] of filter.options.entries()) {
                    if (!isRecord(option)) {
                        addError(`${path}.options.${optionIndex}`, "invalid-multiSelect-option", "MultiSelect filter options must be objects", "Provide { value, label } for each option.");
                        continue;
                    }
                    if (!isNonEmptyString(option.value)) {
                        addError(`${path}.options.${optionIndex}.value`, "missing-multiSelect-option-value", "MultiSelect filter option value must be a non-empty string", "Provide the value passed to the backend query.");
                    }
                    if (!isNonEmptyString(option.label)) {
                        addError(`${path}.options.${optionIndex}.label`, "missing-multiSelect-option-label", "MultiSelect filter option label must be a non-empty string", "Provide the label shown in the UI.");
                    }
                }
                break;
            }
            case "numericRange":
                break;
            case "dateRange":
            case "search":
                break;
            default:
                addError(`${path}.type`, "unsupported-filter-type", `Filter "${String(id ?? index)}" uses unsupported type "${String(filter.type)}"`, 'Use one of "select", "multiSelect", "dateRange", "search", or "numericRange".');
        }
    }
    const widgetIds = new Set();
    for (const [index, widget] of widgets.entries()) {
        const path = `widgets.${index}`;
        if (!isRecord(widget)) {
            addError(path, "invalid-widget", `Widget at index ${index} must be an object`, "Replace this entry with a widget object with type, id, dataSource and config (e.g. config.columns for table).");
            continue;
        }
        const id = widget.id;
        if (!isNonEmptyString(id)) {
            addError(`${path}.id`, "missing-widget-id", `Widget at index ${index} is missing id`, "Add a unique string id for this widget (e.g. \"tasks-table\", \"summary-kpi\").");
        }
        else if (widgetIds.has(id)) {
            addError(`${path}.id`, "duplicate-widget-id", `Duplicate widget id "${id}"`, "Give this widget a different id that is not used by any other widget in the report.");
        }
        else {
            widgetIds.add(id);
        }
        if (!isNonEmptyString(widget.dataSource)) {
            addError(`${path}.dataSource`, "missing-widget-data-source", `Widget "${String(id ?? index)}" must reference a dataSource`, "Set dataSource to the id of one of the keys in ReportSpec.dataSources.");
        }
        else if (!dataSourceNames.has(widget.dataSource)) {
            addError(`${path}.dataSource`, "unknown-widget-data-source", `Widget "${String(id ?? index)}" references unknown dataSource "${widget.dataSource}"`, "Change dataSource to a key that exists in ReportSpec.dataSources, or add a dataSource with that id.");
        }
        if (!isRecord(widget.config)) {
            addError(`${path}.config`, "missing-widget-config", `Widget "${String(id ?? index)}" must define a config object`, "Add a config object with the fields required for this widget type (e.g. columns for table, categoryKey/valueKey for barChart, valueKey for kpi).");
            continue;
        }
        const queryName = isNonEmptyString(widget.dataSource) && dataSourceQueries.has(widget.dataSource)
            ? dataSourceQueries.get(widget.dataSource)
            : undefined;
        const dataSourceDelivery = isNonEmptyString(widget.dataSource) && dataSources[widget.dataSource] != null
            ? getEffectiveDataSourceDelivery(dataSources[widget.dataSource])
            : undefined;
        const sizeConstraints = getWidgetSizeConstraints(widget.type);
        const minWidthPx = parseCssSizeToPixels(sizeConstraints.minWidth) ?? 0;
        const minHeightPx = parseCssSizeToPixels(sizeConstraints.minHeight) ?? 0;
        if (widget.width !== undefined) {
            if (!isNonEmptyString(widget.width)) {
                addError(`${path}.width`, "invalid-widget-width", `Widget "${String(id ?? index)}" width must be a non-empty string`, "Use a CSS size string such as \"100%\", \"320px\", or \"24rem\".");
            }
            else {
                const widthPx = parseCssSizeToPixels(widget.width);
                if (widthPx !== null && widthPx < minWidthPx) {
                    addError(`${path}.width`, "widget-width-below-minimum", `Widget "${String(id ?? index)}" width ${widget.width} is smaller than the minimum ${sizeConstraints.minWidth} for ${widget.type}`, `Use at least ${sizeConstraints.minWidth}, or omit width and let the renderer clamp automatically.`);
                }
            }
        }
        if (widget.height !== undefined) {
            if (!isNonEmptyString(widget.height)) {
                addError(`${path}.height`, "invalid-widget-height", `Widget "${String(id ?? index)}" height must be a non-empty string`, "Use a CSS size string such as \"260px\" or \"18rem\".");
            }
            else {
                const heightPx = parseCssSizeToPixels(widget.height);
                if (heightPx !== null && heightPx < minHeightPx) {
                    addError(`${path}.height`, "widget-height-below-minimum", `Widget "${String(id ?? index)}" height ${widget.height} is smaller than the minimum ${sizeConstraints.minHeight} for ${widget.type}`, `Use at least ${sizeConstraints.minHeight}, or omit height and let the renderer clamp automatically.`);
                }
            }
        }
        if (dataSourceDelivery?.mode === "paginatedList" && widget.type !== "table") {
            addError(`${path}.dataSource`, "invalid-widget-delivery-mode", `Widget "${String(id ?? index)}" of type "${widget.type}" cannot use paginatedList dataSource "${widget.dataSource}"`, "Use delivery.mode = \"fullVisual\" for charts, or \"summary\" for KPI/aggregate widgets.");
        }
        if (dataSourceDelivery?.mode === "summary" && widget.type === "table") {
            addError(`${path}.dataSource`, "invalid-widget-delivery-mode", `Table widget "${String(id ?? index)}" cannot use summary dataSource "${widget.dataSource}"`, "Use delivery.mode = \"paginatedList\" for list tables, or switch to a KPI/chart widget.");
        }
        switch (widget.type) {
            case "table": {
                if (!Array.isArray(widget.config.columns)) {
                    addError(`${path}.config.columns`, "invalid-table-columns", `Table widget "${String(id ?? index)}" must define a columns array`, "Add config.columns as an array with at least one object: { key: \"fieldName\", label: \"Label\" }.");
                    break;
                }
                if (widget.config.columns.length === 0) {
                    addError(`${path}.config.columns`, "empty-table-columns", `Table widget "${String(id ?? index)}" has an empty columns array`, "Add at least one column to config.columns, e.g. { key: \"name\", label: \"Task\" }.");
                    break;
                }
                for (const [columnIndex, column] of widget.config.columns.entries()) {
                    if (!isRecord(column)) {
                        addError(`${path}.config.columns.${columnIndex}`, "invalid-table-column", "Table columns must be objects", "Provide { key, label, type? } for each column.");
                        continue;
                    }
                    validateFieldReference(`${path}.config.columns.${columnIndex}.key`, queryName, column.key, "Table column key");
                    if (!isNonEmptyString(column.label)) {
                        addError(`${path}.config.columns.${columnIndex}.label`, "missing-table-column-label", "Table column label must be a non-empty string", "Provide a label shown in the rendered table.");
                    }
                    if (column.type !== undefined &&
                        !["string", "number", "date"].includes(String(column.type))) {
                        addError(`${path}.config.columns.${columnIndex}.type`, "invalid-table-column-type", `Table column type "${String(column.type)}" is not supported`, 'Use "string", "number", or "date".');
                    }
                }
                if (widget.config.groupByKey !== undefined) {
                    if (!isNonEmptyString(widget.config.groupByKey)) {
                        addError(`${path}.config.groupByKey`, "invalid-groupByKey", "Table groupByKey must be a non-empty string when present", "Use a row field key to group by (e.g. projectName).");
                    }
                    else if (queryName && fieldLookup[queryName]) {
                        validateFieldReference(`${path}.config.groupByKey`, queryName, widget.config.groupByKey, "Table groupByKey");
                    }
                }
                if (widget.config.groupLabelKey !== undefined && !isNonEmptyString(widget.config.groupLabelKey)) {
                    addError(`${path}.config.groupLabelKey`, "invalid-groupLabelKey", "Table groupLabelKey must be a non-empty string when present", "Use a row field key for the group header label, or omit to use group value.");
                }
                const aggs = widget.config.aggregations;
                if (aggs !== undefined) {
                    if (!Array.isArray(aggs)) {
                        addError(`${path}.config.aggregations`, "invalid-aggregations", "Table aggregations must be an array", "Provide an array of { key: string, op: \"sum\" | \"avg\" | \"min\" | \"max\" | \"count\" }.");
                    }
                    else {
                        const validOps = ["sum", "avg", "min", "max", "count"];
                        for (const [aggIndex, agg] of aggs.entries()) {
                            if (!isRecord(agg)) {
                                addError(`${path}.config.aggregations.${aggIndex}`, "invalid-aggregation-item", "Aggregation must be an object with key and op", "Provide { key: string, op: \"sum\" | \"avg\" | \"min\" | \"max\" | \"count\" }.");
                            }
                            else {
                                if (!isNonEmptyString(agg.key)) {
                                    addError(`${path}.config.aggregations.${aggIndex}.key`, "invalid-aggregation-key", "Aggregation key must be a non-empty string", "Use a column key from config.columns.");
                                }
                                if (agg.op !== undefined && !validOps.includes(String(agg.op))) {
                                    addError(`${path}.config.aggregations.${aggIndex}.op`, "invalid-aggregation-op", `Aggregation op must be one of ${validOps.join(", ")}`, `Set op to one of: ${validOps.join(", ")}.`);
                                }
                            }
                        }
                    }
                }
                const tableSortRaw = widget.config.sort;
                if (tableSortRaw !== undefined) {
                    const tableSortArr = Array.isArray(tableSortRaw) ? tableSortRaw : [tableSortRaw];
                    for (const [i, item] of tableSortArr.entries()) {
                        if (!isRecord(item) || !isNonEmptyString(item.key)) {
                            addError(`${path}.config.sort${Array.isArray(tableSortRaw) ? `.${i}.key` : ".key"}`, "invalid-table-sort-key", "Table sort item key must be a non-empty string", "Use a row field key for sort.");
                        }
                        if (isRecord(item) && item.direction !== undefined && !["asc", "desc"].includes(String(item.direction))) {
                            addError(`${path}.config.sort${Array.isArray(tableSortRaw) ? `.${i}.direction` : ".direction"}`, "invalid-table-sort-direction", "Table sort direction must be \"asc\" or \"desc\"", "Set direction to \"asc\" or \"desc\".");
                        }
                    }
                }
                const drillDown = widget.config.drillDown;
                if (drillDown !== undefined && drillDown !== null) {
                    if (!isRecord(drillDown) || !isNonEmptyString(drillDown.urlTemplate)) {
                        addError(`${path}.config.drillDown.urlTemplate`, "invalid-drillDown-urlTemplate", "Table drillDown.urlTemplate must be a non-empty string", "Use a URL with placeholders like {id} or {taskId} replaced by row values.");
                    }
                    const d = drillDown;
                    if (d.paramKeys !== undefined && !Array.isArray(d.paramKeys)) {
                        addError(`${path}.config.drillDown.paramKeys`, "invalid-drillDown-paramKeys", "Table drillDown.paramKeys must be an array of string keys", "List row keys that map to urlTemplate placeholders (e.g. [\"id\", \"taskId\"]).");
                    }
                    if (d.target !== undefined &&
                        d.target !== "_self" &&
                        d.target !== "_blank") {
                        addError(`${path}.config.drillDown.target`, "invalid-drillDown-target", "Table drillDown.target must be \"_self\" or \"_blank\"", "Use _blank to open in new tab (default), or _self to navigate in same window.");
                    }
                }
                break;
            }
            case "barChart":
                validateFieldReference(`${path}.config.categoryKey`, queryName, widget.config.categoryKey, "Bar chart categoryKey");
                validateFieldReference(`${path}.config.valueKey`, queryName, widget.config.valueKey, "Bar chart valueKey");
                break;
            case "kpi":
                validateFieldReference(`${path}.config.valueKey`, queryName, widget.config.valueKey, "KPI valueKey", { allowSyntheticCount: true });
                if (widget.config.format !== undefined &&
                    !["number", "percent", "currency", "plain"].includes(String(widget.config.format))) {
                    addError(`${path}.config.format`, "invalid-kpi-format", `KPI format "${String(widget.config.format)}" is not supported`, 'Use "number", "percent", "currency", or "plain".');
                }
                if (widget.config.trend !== undefined) {
                    if (!isRecord(widget.config.trend) || !isNonEmptyString(widget.config.trend.dataKey)) {
                        addError(`${path}.config.trend.dataKey`, "invalid-kpi-trend-dataKey", "KPI trend.dataKey must be a non-empty string", "Use a field key from the query result for the sparkline values.");
                    }
                    else if (queryName && fieldLookup[queryName]) {
                        validateFieldReference(`${path}.config.trend.dataKey`, queryName, widget.config.trend.dataKey, "KPI trend dataKey");
                    }
                }
                break;
            case "stackedBarChart": {
                const stackedConfig = widget.config;
                if (!isNonEmptyString(stackedConfig?.categoryKey)) {
                    addError(`${path}.config.categoryKey`, "invalid-stackedBarChart-categoryKey", "Stacked bar chart categoryKey must be a non-empty string", "Use a field key for the x-axis category.");
                }
                else if (queryName && fieldLookup[queryName]) {
                    validateFieldReference(`${path}.config.categoryKey`, queryName, stackedConfig.categoryKey, "Stacked bar chart categoryKey");
                }
                if (!Array.isArray(stackedConfig?.series) || stackedConfig.series.length === 0) {
                    addError(`${path}.config.series`, "invalid-stackedBarChart-series", "Stacked bar chart must define a non-empty series array", "Add config.series as array of { key: string, label?: string } for each stack segment.");
                }
                else {
                    for (const [sIdx, s] of stackedConfig.series.entries()) {
                        if (!isRecord(s) || !isNonEmptyString(s.key)) {
                            addError(`${path}.config.series.${sIdx}.key`, "invalid-stackedBarChart-series-key", "Stacked bar chart series item key must be a non-empty string", "Use a value field key from the query result.");
                        }
                        else if (queryName && fieldLookup[queryName]) {
                            validateFieldReference(`${path}.config.series.${sIdx}.key`, queryName, s.key, "Stacked bar chart series key");
                        }
                    }
                }
                break;
            }
            case "lineChart":
                validateFieldReference(`${path}.config.categoryKey`, queryName, widget.config.categoryKey, "Line chart categoryKey");
                validateFieldReference(`${path}.config.valueKey`, queryName, widget.config.valueKey, "Line chart valueKey");
                break;
            default:
                addError(`${path}.type`, "unsupported-widget-type", `Widget "${String(id ?? index)}" uses unsupported type "${String(widget.type)}"`, 'Use one of "table", "barChart", "stackedBarChart", "lineChart", or "kpi".');
        }
    }
    // Optional sections: each widgetId must reference an existing widget; section ids must be unique
    const validWidgetIdsHint = widgetIds.size > 0
        ? ` Valid widget ids from spec.widgets: ${Array.from(widgetIds).join(", ")}.`
        : " Define widgets in spec.widgets first, each with a unique id; then use those exact ids in sections[].widgetIds.";
    const sections = Array.isArray(rawSpec.sections) ? rawSpec.sections : [];
    if (sections.length > 0) {
        const sectionIds = new Set();
        for (const [sIdx, sec] of sections.entries()) {
            const sPath = `sections.${sIdx}`;
            if (!isRecord(sec)) {
                addError(sPath, "invalid-section", "Section must be an object with id and widgetIds", "Provide { id: string, title?: string, widgetIds: string[] }.");
                continue;
            }
            const secId = sec.id;
            if (!isNonEmptyString(secId)) {
                addError(`${sPath}.id`, "missing-section-id", "Section id is required", "Use a unique string id for the section.");
            }
            else if (sectionIds.has(secId)) {
                addError(`${sPath}.id`, "duplicate-section-id", `Duplicate section id "${secId}"`, "Use a unique id per section.");
            }
            else {
                sectionIds.add(secId);
            }
            const wids = sec.widgetIds;
            if (!Array.isArray(wids)) {
                addError(`${sPath}.widgetIds`, "invalid-section-widgetIds", "Section widgetIds must be an array", "Provide an array of widget id strings.");
            }
            else {
                for (const [wIdx, wid] of wids.entries()) {
                    if (!widgetIds.has(String(wid))) {
                        addError(`${sPath}.widgetIds.${wIdx}`, "unknown-section-widget-id", `Section references unknown widget id "${String(wid)}"`, `Use a widget id from ReportSpec.widgets.${validWidgetIdsHint}`);
                    }
                }
            }
        }
    }
    // Optional tabs: each widgetId must reference an existing widget; tab ids must be unique (tabs take precedence over sections)
    const tabs = Array.isArray(rawSpec.tabs) ? rawSpec.tabs : [];
    if (tabs.length > 0) {
        const tabIds = new Set();
        for (const [tIdx, tab] of tabs.entries()) {
            const tPath = `tabs.${tIdx}`;
            if (!isRecord(tab)) {
                addError(tPath, "invalid-tab", "Tab must be an object with id, label, and widgetIds", "Provide { id: string, label: string, widgetIds: string[] }.");
                continue;
            }
            const tabId = tab.id;
            if (!isNonEmptyString(tabId)) {
                addError(`${tPath}.id`, "missing-tab-id", "Tab id is required", "Use a unique string id for the tab.");
            }
            else if (tabIds.has(tabId)) {
                addError(`${tPath}.id`, "duplicate-tab-id", `Duplicate tab id "${tabId}"`, "Use a unique id per tab.");
            }
            else {
                tabIds.add(tabId);
            }
            if (!isNonEmptyString(tab.label)) {
                addError(`${tPath}.label`, "missing-tab-label", "Tab label is required", "Provide a display label for the tab.");
            }
            const wids = tab.widgetIds;
            if (!Array.isArray(wids)) {
                addError(`${tPath}.widgetIds`, "invalid-tab-widgetIds", "Tab widgetIds must be an array", "Provide an array of widget id strings.");
            }
            else {
                for (const [wIdx, wid] of wids.entries()) {
                    if (!widgetIds.has(String(wid))) {
                        addError(`${tPath}.widgetIds.${wIdx}`, "unknown-tab-widget-id", `Tab references unknown widget id "${String(wid)}"`, `Use a widget id from ReportSpec.widgets.${validWidgetIdsHint}`);
                    }
                }
            }
        }
    }
    // Optional policy check: when provided and returns allowed: false, add policy errors and set valid to false
    if (options?.policy) {
        const policyResult = options.policy(spec);
        if (!policyResult.allowed && Array.isArray(policyResult.errors)) {
            for (const err of policyResult.errors) {
                diagnostics.push({
                    path: "$",
                    code: err.code ?? "policy-error",
                    message: err.message ?? "Policy check failed",
                    severity: "error",
                });
            }
        }
    }
    return {
        version: REPORT_SPEC_VERSION,
        valid: diagnostics.length === 0,
        errors: diagnostics.map((diagnostic) => diagnostic.message),
        diagnostics,
    };
}
/**
 * Returns filter state with spec defaults applied for missing values.
 * Does not mutate the input.
 */
export function getEffectiveFilterState(spec, filterState) {
    const out = { ...filterState };
    for (const filter of spec.filters) {
        if (out[filter.id] !== undefined && out[filter.id] !== null)
            continue;
        if (filter.defaultValue !== undefined && filter.defaultValue !== null) {
            out[filter.id] = filter.defaultValue;
        }
    }
    return out;
}
/**
 * Returns initial filter state from spec defaults only.
 * Use to seed UI state when no user selection exists yet.
 */
export function getDefaultFilterState(spec) {
    const out = {};
    for (const filter of spec.filters) {
        if (filter.defaultValue !== undefined && filter.defaultValue !== null) {
            out[filter.id] = filter.defaultValue;
        }
    }
    return out;
}
function hasRequiredFilterValue(filter, value) {
    if (value === undefined || value === null)
        return false;
    switch (filter.type) {
        case "select":
        case "search":
            return typeof value === "string" && value.trim().length > 0;
        case "multiSelect":
            return Array.isArray(value) && value.length > 0;
        case "dateRange": {
            const range = value;
            return Boolean(range?.from ?? range?.to);
        }
        case "numericRange": {
            const range = value;
            return ((typeof range?.from === "number" && !Number.isNaN(range.from)) ||
                (typeof range?.to === "number" && !Number.isNaN(range.to)));
        }
        default:
            return false;
    }
}
/**
 * Validates that all required filters have a value in the given state.
 * @throws Error if any required filter is missing a value
 */
export function validateRequiredFilters(spec, filterState) {
    const diagnostics = [];
    for (const filter of spec.filters) {
        if (!filter.required)
            continue;
        const value = filterState[filter.id];
        if (!hasRequiredFilterValue(filter, value)) {
            diagnostics.push(`Required filter "${filter.id}" (${filter.label}) has no value.`);
        }
    }
    if (diagnostics.length > 0) {
        throw new Error(`Invalid filter state: ${diagnostics.join(" ")}`);
    }
}
function normalizeSort(sort) {
    if (sort == null)
        return [];
    return Array.isArray(sort) ? sort : [sort];
}
function sortRows(rows, sortItems) {
    if (sortItems.length === 0)
        return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
        for (const { key, direction } of sortItems) {
            const va = a[key];
            const vb = b[key];
            const cmp = va === vb ? 0 : va == null ? -1 : vb == null ? 1 : String(va).localeCompare(String(vb), undefined, { numeric: true });
            if (cmp !== 0)
                return direction === "desc" ? -cmp : cmp;
        }
        return 0;
    });
    return copy;
}
/** Sort rows by a single category key for line chart ordering (numeric/date-friendly). */
function sortRowsByCategory(rows, categoryKey) {
    if (rows.length === 0)
        return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
        const va = a[categoryKey];
        const vb = b[categoryKey];
        if (va === vb)
            return 0;
        if (va == null)
            return -1;
        if (vb == null)
            return 1;
        const aNum = Number(va);
        const bNum = Number(vb);
        if (!Number.isNaN(aNum) && !Number.isNaN(bNum))
            return aNum - bNum;
        const aDate = typeof va === "string" ? new Date(va).getTime() : NaN;
        const bDate = typeof vb === "string" ? new Date(vb).getTime() : NaN;
        if (!Number.isNaN(aDate) && !Number.isNaN(bDate))
            return aDate - bDate;
        return String(va).localeCompare(String(vb), undefined, { numeric: true });
    });
    return copy;
}
function applyLimit(rows, limit, pageSize) {
    const cap = limit != null && limit > 0 ? limit : pageSize != null && pageSize > 0 ? pageSize : undefined;
    return cap != null ? rows.slice(0, cap) : rows;
}
function computeAggregations(rows, aggregations) {
    const out = {};
    for (const { key, op } of aggregations) {
        const values = rows.map((r) => r[key]);
        const numeric = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
        switch (op) {
            case "count":
                out[key] = rows.length;
                break;
            case "sum":
                out[key] = numeric.length ? numeric.reduce((a, b) => a + b, 0) : null;
                break;
            case "avg":
                out[key] = numeric.length ? numeric.reduce((a, b) => a + b, 0) / numeric.length : null;
                break;
            case "min":
                out[key] = numeric.length ? Math.min(...numeric) : null;
                break;
            case "max":
                out[key] = numeric.length ? Math.max(...numeric) : null;
                break;
            default:
                out[key] = null;
        }
    }
    return out;
}
function getFilterDataSourceTargets(dataSource) {
    if (Array.isArray(dataSource)) {
        return dataSource.filter((value) => typeof value === "string");
    }
    return typeof dataSource === "string" ? [dataSource] : [];
}
function normalizeGroupIds(groupIds) {
    if (!Array.isArray(groupIds))
        return [];
    return Array.from(new Set(groupIds.filter((value) => typeof value === "string" && value.trim() !== "")));
}
export function getWidgetGroupIds(spec, widgetId) {
    const groups = new Set();
    const widget = spec.widgets.find((candidate) => candidate.id === widgetId);
    if (widget) {
        for (const groupId of normalizeGroupIds(widget.groupIds)) {
            groups.add(groupId);
        }
    }
    for (const group of spec.groups ?? []) {
        if (group.widgetIds.includes(widgetId)) {
            groups.add(group.id);
        }
    }
    for (const tab of spec.tabs ?? []) {
        if (tab.widgetIds.includes(widgetId)) {
            groups.add(tab.id);
            for (const groupId of normalizeGroupIds(tab.groupIds)) {
                groups.add(groupId);
            }
        }
    }
    for (const section of spec.sections ?? []) {
        if (section.widgetIds.includes(widgetId)) {
            groups.add(section.id);
            for (const groupId of normalizeGroupIds(section.groupIds)) {
                groups.add(groupId);
            }
        }
    }
    return Array.from(groups);
}
export function filterAppliesToGroupIds(filter, groupIds) {
    const filterGroupIds = normalizeGroupIds(filter.groupIds);
    if (filterGroupIds.length === 0)
        return true;
    return filterGroupIds.some((groupId) => groupIds.includes(groupId));
}
/**
 * Builds params for a dataSource from filterState and filter specs.
 * Uses filter.defaultValue when filterState has no value for a filter.
 */
export function buildParamsForDataSource(dataSourceName, spec, filterState, groupIds = []) {
    const params = {};
    const ds = spec.dataSources[dataSourceName];
    if (ds?.params) {
        Object.assign(params, ds.params);
    }
    for (const filter of spec.filters) {
        if (!getFilterDataSourceTargets(filter.dataSource).includes(dataSourceName))
            continue;
        if (!filterAppliesToGroupIds(filter, groupIds))
            continue;
        const filterId = filter.id;
        const value = filterState[filterId] !== undefined && filterState[filterId] !== null
            ? filterState[filterId]
            : filter.defaultValue;
        if (value === undefined || value === null)
            continue;
        if (filter.type === "select") {
            const paramKey = filter.paramKey ?? filterId;
            params[paramKey] = value;
        }
        else if (filter.type === "multiSelect") {
            const paramKey = filter.paramKey ?? filterId;
            const arr = Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
            if (arr.length > 0) {
                params[paramKey] = arr.join(",");
            }
        }
        else if (filter.type === "dateRange") {
            const range = value;
            const keyFrom = filter.paramKeyFrom ?? `${filterId}From`;
            const keyTo = filter.paramKeyTo ?? `${filterId}To`;
            if (range?.from)
                params[keyFrom] = range.from;
            if (range?.to)
                params[keyTo] = range.to;
        }
        else if (filter.type === "search") {
            const paramKey = filter.paramKey ?? filterId;
            params[paramKey] = value;
        }
        else if (filter.type === "numericRange") {
            const range = value;
            const keyFrom = filter.paramKeyFrom ?? `${filterId}From`;
            const keyTo = filter.paramKeyTo ?? `${filterId}To`;
            if (typeof range?.from === "number" && !Number.isNaN(range.from)) {
                params[keyFrom] = range.from;
            }
            if (typeof range?.to === "number" && !Number.isNaN(range.to)) {
                params[keyTo] = range.to;
            }
        }
    }
    return params;
}
function isQueryResultEnvelope(value) {
    return (typeof value === "object" &&
        value !== null &&
        "data" in value &&
        Array.isArray(value.data));
}
function isLimitExceededResult(value) {
    return (typeof value === "object" &&
        value !== null &&
        "kind" in value &&
        value.kind === "limitExceeded");
}
function getLegacyPaginationMetadata(value) {
    const record = value;
    const page = typeof record.page === "number" ? record.page : undefined;
    const pageSize = typeof record.pageSize === "number" ? record.pageSize : undefined;
    const totalCount = typeof record.totalCount === "number" ? record.totalCount : undefined;
    const totalPagesFromRecord = typeof record.totalPages === "number" ? record.totalPages : undefined;
    const hasMore = typeof record.hasMore === "boolean" ? record.hasMore : undefined;
    if (page == null && pageSize == null && totalCount == null && totalPagesFromRecord == null && hasMore == null) {
        return undefined;
    }
    const resolvedPage = page ?? 1;
    const resolvedPageSize = pageSize ?? value.data.length ?? 1;
    const resolvedTotalCount = totalCount ?? value.data.length ?? 0;
    const totalPages = totalPagesFromRecord ??
        (resolvedPageSize > 0 ? Math.ceil(resolvedTotalCount / resolvedPageSize) || 1 : 1);
    return {
        page: resolvedPage,
        pageSize: resolvedPageSize,
        totalPages,
        ...(totalCount != null ? { totalCount: totalCount } : {}),
        ...(hasMore != null ? { hasMore } : {}),
    };
}
function normalizeQueryResult(result) {
    if (isLimitExceededResult(result)) {
        return {
            rows: [],
            totalCount: result.totalCount,
            limitExceeded: {
                totalCount: result.totalCount,
                limit: result.limit,
                ...(result.message ? { message: result.message } : {}),
            },
        };
    }
    if (isQueryResultEnvelope(result)) {
        const pagination = result.pagination ?? getLegacyPaginationMetadata(result);
        return {
            rows: result.data,
            ...(result.totalCount != null ? { totalCount: result.totalCount } : {}),
            ...(pagination ? { pagination } : {}),
        };
    }
    return {
        rows: (Array.isArray(result) ? result : [result]),
    };
}
/**
 * Resolves a ReportSpec into a view-ready ResolvedReport using the DataProvider.
 */
export async function resolveReport(spec, dataProvider, filterState = {}, options) {
    const onAudit = options?.onAudit;
    try {
        const validation = validateReportSpec(spec);
        if (!validation.valid) {
            throw new Error(`Invalid ReportSpec: ${validation.errors.join("; ")}`);
        }
        const effectiveFilterState = getEffectiveFilterState(spec, filterState);
        validateRequiredFilters(spec, effectiveFilterState);
        const dataCache = new Map();
        const resolvedQueries = [];
        const fetchData = async (widget) => {
            const dataSourceName = widget.dataSource;
            const ds = spec.dataSources[dataSourceName];
            const groupIds = getWidgetGroupIds(spec, widget.id);
            const params = buildParamsForDataSource(dataSourceName, spec, effectiveFilterState, groupIds);
            const delivery = getEffectiveDataSourceDelivery(ds);
            const cacheKey = JSON.stringify({
                dataSourceName,
                params,
                delivery,
            });
            if (!dataCache.has(cacheKey)) {
                const result = await dataProvider.runQuery({
                    name: ds.query,
                    params,
                    execution: {
                        deliveryMode: delivery.mode,
                        ...(delivery.mode === "paginatedList" && delivery.pageSize != null
                            ? { pageSize: delivery.pageSize }
                            : {}),
                        ...(delivery.mode === "fullVisual" && delivery.maxRows != null
                            ? { maxRows: delivery.maxRows }
                            : {}),
                    },
                    context: {
                        widgetId: widget.id,
                        dataSource: dataSourceName,
                        ...(groupIds.length > 0 ? { groupIds } : {}),
                    },
                });
                const normalized = normalizeQueryResult(result);
                let rows = normalized.rows;
                const sortItems = normalizeSort(ds.sort);
                rows = sortRows(rows, sortItems);
                const providerPagination = normalized.pagination;
                const limitExceeded = normalized.limitExceeded;
                const totalCount = limitExceeded?.totalCount ??
                    providerPagination?.totalCount ??
                    normalized.totalCount ??
                    rows.length;
                const shouldApplyLegacyPaginationLimit = delivery.mode === "paginatedList" && providerPagination == null;
                const paginationPageSize = shouldApplyLegacyPaginationLimit
                    ? delivery.pageSize ?? ds.pagination?.pageSize
                    : undefined;
                rows = applyLimit(rows, ds.limit ?? undefined, paginationPageSize);
                const rowCount = rows.length;
                const resolvedPageSize = providerPagination?.pageSize ??
                    ((delivery.pageSize != null && delivery.pageSize > 0)
                        ? delivery.pageSize
                        : rowCount || 1);
                const resolvedPage = providerPagination?.page ?? 1;
                const hasMore = providerPagination?.hasMore ??
                    (delivery.mode === "paginatedList" && resolvedPageSize > 0
                        ? resolvedPage * resolvedPageSize < totalCount
                        : false);
                const totalPages = providerPagination?.totalPages ??
                    (delivery.mode === "paginatedList" && resolvedPageSize > 0
                        ? Math.ceil(totalCount / resolvedPageSize) || 1
                        : 1);
                const pagination = delivery.mode === "paginatedList" &&
                    (providerPagination != null || (delivery.pageSize != null && delivery.pageSize > 0))
                    ? {
                        totalCount,
                        pageSize: resolvedPageSize,
                        page: resolvedPage,
                        totalPages,
                        ...(hasMore ? { hasMore } : {}),
                    }
                    : undefined;
                dataCache.set(cacheKey, {
                    rows,
                    query: {
                        dataSource: dataSourceName,
                        query: ds.query,
                        params,
                        rowCount,
                        deliveryMode: delivery.mode,
                        ...(pagination ? { pagination } : {}),
                        ...(limitExceeded ? { limitExceeded } : {}),
                    },
                });
            }
            const cached = dataCache.get(cacheKey);
            const query = {
                ...cached.query,
                widgetId: widget.id,
                ...(groupIds.length > 0 ? { groupIds } : {}),
            };
            resolvedQueries.push(query);
            return { rows: cached.rows, query };
        };
        const resolvedWidgets = [];
        for (const widget of spec.widgets) {
            const { rows } = await fetchData(widget);
            if (widget.type === "table") {
                const tableSpec = widget;
                let tableRows = rows;
                const widgetSort = normalizeSort(tableSpec.config.sort);
                if (widgetSort.length > 0) {
                    tableRows = sortRows(tableRows, widgetSort);
                }
                const columns = tableSpec.config.columns.map((c) => ({
                    key: c.key,
                    label: c.label,
                }));
                const groupByKey = tableSpec.config.groupByKey;
                let groups;
                if (groupByKey && groupByKey.trim() !== "") {
                    const labelKey = (tableSpec.config.groupLabelKey?.trim() || groupByKey);
                    const map = new Map();
                    for (const row of tableRows) {
                        const key = row[groupByKey];
                        const groupKey = key === undefined || key === null ? "\0" : String(key);
                        let list = map.get(groupKey);
                        if (!list) {
                            map.set(groupKey, (list = []));
                        }
                        list.push(row);
                    }
                    groups = [];
                    for (const [groupKey, groupRows] of map.entries()) {
                        if (groupRows.length === 0)
                            continue;
                        const label = groupKey === "\0"
                            ? "—"
                            : (groupRows[0][labelKey] != null ? String(groupRows[0][labelKey]) : groupKey);
                        groups.push({ label, rows: groupRows });
                    }
                }
                const aggregations = tableSpec.config.aggregations;
                const footer = aggregations != null && aggregations.length > 0
                    ? computeAggregations(tableRows, aggregations)
                    : undefined;
                resolvedWidgets.push({
                    spec: widget,
                    data: {
                        type: "table",
                        data: {
                            rows: tableRows,
                            columns,
                            ...(groups && groups.length > 0 ? { groups } : {}),
                            ...(footer != null ? { footer } : {}),
                            ...(tableSpec.config.drillDown != null ? { drillDown: tableSpec.config.drillDown } : {}),
                        },
                    },
                });
            }
            else if (widget.type === "barChart") {
                const chartSpec = widget;
                resolvedWidgets.push({
                    spec: widget,
                    data: {
                        type: "barChart",
                        data: {
                            data: rows,
                            categoryKey: chartSpec.config.categoryKey,
                            valueKey: chartSpec.config.valueKey,
                        },
                    },
                });
            }
            else if (widget.type === "stackedBarChart") {
                const chartSpec = widget;
                const series = chartSpec.config.series.map((s) => ({
                    key: s.key,
                    label: s.label ?? s.key,
                }));
                resolvedWidgets.push({
                    spec: widget,
                    data: {
                        type: "stackedBarChart",
                        data: {
                            data: rows,
                            categoryKey: chartSpec.config.categoryKey,
                            series,
                        },
                    },
                });
            }
            else if (widget.type === "lineChart") {
                const chartSpec = widget;
                const orderedData = sortRowsByCategory(rows, chartSpec.config.categoryKey);
                resolvedWidgets.push({
                    spec: widget,
                    data: {
                        type: "lineChart",
                        data: {
                            data: orderedData,
                            categoryKey: chartSpec.config.categoryKey,
                            valueKey: chartSpec.config.valueKey,
                            ...(chartSpec.config.series && chartSpec.config.series.length > 0
                                ? { series: chartSpec.config.series }
                                : {}),
                        },
                    },
                });
            }
            else if (widget.type === "kpi") {
                const kpiSpec = widget;
                const first = rows[0];
                const raw = kpiSpec.config.valueKey === KPI_COUNT_VALUE_KEY
                    ? rows.length
                    : first && typeof first === "object" && kpiSpec.config.valueKey in first
                        ? first[kpiSpec.config.valueKey]
                        : "";
                const value = typeof raw === "number" || typeof raw === "string" ? raw : String(raw ?? "");
                const trendConfig = kpiSpec.config.trend;
                const trendData = trendConfig?.dataKey && rows.length > 0
                    ? rows
                        .slice(0, 10)
                        .map((row) => {
                        const v = row && typeof row === "object" && trendConfig.dataKey in row
                            ? row[trendConfig.dataKey]
                            : undefined;
                        const n = typeof v === "number" && !Number.isNaN(v) ? v : Number(v);
                        return Number.isNaN(n) ? 0 : n;
                    })
                    : undefined;
                resolvedWidgets.push({
                    spec: widget,
                    data: {
                        type: "kpi",
                        data: {
                            value,
                            label: kpiSpec.config.label,
                            ...(kpiSpec.config.format != null ? { format: kpiSpec.config.format } : {}),
                            ...(kpiSpec.config.currencyCode != null ? { currencyCode: kpiSpec.config.currencyCode } : {}),
                            ...(kpiSpec.config.decimalPlaces != null ? { decimalPlaces: kpiSpec.config.decimalPlaces } : {}),
                            ...(trendData != null && trendData.length > 0 ? { trendData } : {}),
                        },
                    },
                });
            }
        }
        const widgetById = new Map();
        for (const w of resolvedWidgets) {
            widgetById.set(w.spec.id, w);
        }
        let sections;
        let tabs;
        if (Array.isArray(spec.tabs) && spec.tabs.length > 0) {
            const referencedIds = new Set();
            tabs = spec.tabs.map((tab) => {
                const tabWidgets = [];
                for (const wid of tab.widgetIds) {
                    const w = widgetById.get(wid);
                    if (w) {
                        tabWidgets.push(w);
                        referencedIds.add(wid);
                    }
                }
                return { id: tab.id, label: tab.label, widgets: tabWidgets };
            });
            const otherWidgets = resolvedWidgets.filter((w) => !referencedIds.has(w.spec.id));
            if (otherWidgets.length > 0) {
                tabs.push({ id: "_other", label: "Other", widgets: otherWidgets });
            }
        }
        else if (Array.isArray(spec.sections) && spec.sections.length > 0) {
            const referencedIds = new Set();
            sections = spec.sections.map((sec) => {
                const secWidgets = [];
                for (const wid of sec.widgetIds) {
                    const w = widgetById.get(wid);
                    if (w) {
                        secWidgets.push(w);
                        referencedIds.add(wid);
                    }
                }
                return { id: sec.id, title: sec.title, widgets: secWidgets };
            });
            const otherWidgets = resolvedWidgets.filter((w) => !referencedIds.has(w.spec.id));
            if (otherWidgets.length > 0) {
                sections.push({ id: "_other", title: "Other", widgets: otherWidgets });
            }
        }
        const result = {
            spec,
            filterState: effectiveFilterState,
            queries: resolvedQueries,
            widgets: resolvedWidgets,
            ...(spec.version != null && spec.version !== "" ? { version: spec.version } : {}),
            ...(sections !== undefined ? { sections } : {}),
            ...(tabs !== undefined ? { tabs } : {}),
            ...(spec.owner != null && spec.owner !== "" ? { owner: spec.owner } : {}),
            ...(spec.author != null && spec.author !== "" ? { author: spec.author } : {}),
        };
        onAudit?.({
            type: "report_generated",
            timestamp: new Date().toISOString(),
            specId: spec.id,
            outcome: "success",
        });
        return result;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        onAudit?.({
            type: "report_generated",
            timestamp: new Date().toISOString(),
            specId: spec.id,
            outcome: "error",
            errorMessage: message,
        });
        throw err;
    }
}
