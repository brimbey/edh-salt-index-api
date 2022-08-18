let arc = require('@architect/functions')

const prettyPrintJSON = (json) => {
    console.log(`[Commanders.ingest]: \n${JSON.stringify(json, null, 4)}`);
}

const getRecords = async (cursor, commanderHashId) => {
    const tables = await arc.tables();
    
    const queryParams = {
        Limit: 100,
        IndexName: 'byCommanderHashId',
        KeyConditionExpression: 'category = :category',
        ProjectionExpression: 'salt',
        ExpressionAttributeNames: {
            '#property_hashId': "commanderHashId",
        },
        ExpressionAttributeValues: {
            ':category': `decks`,
            ':commanderHashId': commanderHashId,
        },
        FilterExpression: '#property_hashId = :commanderHashId'
    };
  
    if (cursor) {
      queryParams.ExclusiveStartKey = {
        category: cursor.category,
        id: cursor.id,
      };
    }

    prettyPrintJSON(queryParams);
    const results = await tables.data.query(queryParams);
    prettyPrintJSON(results);
    
    return results;
  }

const getAllDecksBycommanderHashId = async (commanderHashId) => {
    let items = [];
    let results;

    do {
        console.log(`[Commanders.ingest] DOING IT`);
        results = await getRecords(results?.LastEvaluatedKey, commanderHashId);
        prettyPrintJSON(results);
        items = items.concat(results?.Items);
    } while (results.LastEvaluatedKey);

    return items;
}


exports.ingest = async (payload) => {
    // prettyPrintJSON(payload);

    try {
        if (payload?.commanderHashId) {
            
            let tables = await arc.tables();
        
            const decks = await getAllDecksBycommanderHashId(payload.commanderHashId);
            console.log(`[Commanders.ingest] commanderHashId :: ${payload.commanderHashId}`);
            // prettyPrintJSON(decks);

            let aggregate = 0;
            decks.forEach((item) => {
                aggregate = aggregate + parseFloat(item?.salt);
            })

            const data = await tables.data.put({
                category: 'commanders',
                id: payload?.commanderHashId,
                salt: parseFloat(aggregate / decks?.length),
                commanders: payload?.commanders,
                count: decks?.length,
            });

            console.log(`[Commanders.ingest] PERSISTED COMMANDER!`);
            prettyPrintJSON(data);
        }
    } catch (error) {
        console.log(`[ERROR] - ingest queue update for commanders failed: ${JSON.stringify(error)}`);
    }
}