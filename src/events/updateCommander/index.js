let arc = require('@architect/functions')

const prettyPrintJSON = (json) => {
    console.log(`json value: \n${JSON.stringify(json, null, 4)}`);
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
  
    const results = await tables.data.query(queryParams);
    
    return results;
  }

const getAllDecksBycommanderHashId = async (commanderHashId) => {
    let items = [];
    let results;

    do {
        results = await getRecords(results?.LastEvaluatedKey, commanderHashId);
        items = items.concat(results?.Items);
    } while (results.LastEvaluatedKey);

    return items;
}

exports.handler = arc.events.subscribe(async (payload, callback) => {
    if (payload?.commanderHashId) {
        let tables = await arc.tables();
        const decks = await getAllDecksBycommanderHashId(payload.commanderHashId);
        
        let aggregate = 0;
        decks.forEach((item) => {
            aggregate = aggregate + parseFloat(item?.salt);
        })

        await tables.data.put({
            category: 'commanders',
            id: payload?.commanderHashId,
            salt: parseFloat(aggregate / decks?.length),
            commanders: payload?.commanders,
            count: decks?.length,
        });
    }
});
