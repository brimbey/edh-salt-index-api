let arc = require('@architect/functions');
const { miniSerializeError } = require('@reduxjs/toolkit');

const prettyPrintJSON = (json, logType = 'INFO') => {
    console.log(`[Commanders.ingest][${logType}]: \n${JSON.stringify(json, null, 4)}`);
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

    // prettyPrintJSON(queryParams);
    const results = await tables.data.query(queryParams);
    // prettyPrintJSON(results);
    
    return results;
  }

const getAllDecksBycommanderHashId = async (commanderHashId) => {
    let returnObject = {
        Items: [],
    };
    let results;

    do {
        results = await getRecords(results?.LastEvaluatedKey, commanderHashId);
        // prettyPrintJSON(results);
        returnObject.Items = returnObject.Items.concat(results?.Items);
    } while (results.LastEvaluatedKey);

    return returnObject;
}


exports.ingest = async (payload) => {
    console.log(`[Commanders.ingest] updating commanderHashId :: ${payload.commanderHashId}`);
    try {
        let aggregate = 0.00;
        let tables = await arc.tables();
        
        const decks = await getAllDecksBycommanderHashId(payload.commanderHashId);
        
        decks?.Items?.forEach((item) => {
            const salt = parseFloat(item?.salt);
        
            if (salt && salt > 0) {
                aggregate = aggregate + salt;
            }
        })

        const data = await tables.data.put({
            category: 'commanders',
            id: payload?.commanderHashId,
            salt: parseFloat(aggregate / decks?.Items?.length),
            commanders: payload?.commanders,
            count: decks?.Items?.length,
        });

        console.log(`[Commanders.ingest] ...updated`);
    } catch (error) {
        prettyPrintJSON(error, 'ERROR');
    }
}