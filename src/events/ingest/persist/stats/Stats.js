let arc = require('@architect/functions')

const prettyPrintJSON = (json, logType = 'INFO') => {
    console.log(`[Stats.ingest][${logType}]: \n${JSON.stringify(json, null, 4)}`);
}

exports.ingest = async (payload) => {
    try {
        if (payload?.operation === 'create') {
            console.log(`[Stats.ingest] incrementing stats`);

            const tables = await arc.tables();
            await tables.data.update({
            Key: { "category": "stats", "id": "stats" },
            ExpressionAttributeValues: { 
                ":inc": 1,
            },
            UpdateExpression: "SET totalCount = totalCount + :inc"
            })

            console.log(`[Stats.ingest] ...updated`);
        }
    } catch (error) {
        prettyPrintJSON(error, 'ERROR');
    }
}