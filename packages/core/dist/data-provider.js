function isQueryResultEnvelope(result) {
    return typeof result === "object" && result !== null && "data" in result && Array.isArray(result.data);
}
function isLimitExceededResult(result) {
    return typeof result === "object" && result !== null && result.kind === "limitExceeded";
}
function getRowsFromResult(result) {
    if (isLimitExceededResult(result))
        return [];
    if (isQueryResultEnvelope(result))
        return result.data;
    return Array.isArray(result) ? result : [result];
}
function matchesScalarType(value, type) {
    if (type === "date")
        return typeof value === "string";
    return typeof value === type;
}
export function validateQueryResultAgainstCatalog(queryCatalog, queryName, result) {
    const query = queryCatalog.find((entry) => entry.name === queryName);
    const fieldShape = query?.fieldShape;
    if (!fieldShape)
        return result;
    const rows = getRowsFromResult(result);
    for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        if (typeof row !== "object" || row === null || Array.isArray(row)) {
            throw new Error(`Query "${queryName}" returned row ${index} that is not an object.`);
        }
        const record = row;
        for (const [fieldName, contract] of Object.entries(fieldShape)) {
            const value = record[fieldName];
            if (value === undefined || value === null) {
                if (!contract.optional) {
                    throw new Error(`Query "${queryName}" returned row ${index} without required field "${fieldName}".`);
                }
                continue;
            }
            if (!matchesScalarType(value, contract.type)) {
                throw new Error(`Query "${queryName}" returned field "${fieldName}" in row ${index} with type "${typeof value}", expected "${contract.type}".`);
            }
        }
    }
    return result;
}
export function createContractEnforcedDataProvider(queryCatalog, dataProvider) {
    return {
        async runQuery(request) {
            const result = await dataProvider.runQuery(request);
            return validateQueryResultAgainstCatalog(queryCatalog, request.name, result);
        },
    };
}
