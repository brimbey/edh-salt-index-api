let arc = require('@architect/functions')
const Commanders = require("./persist/commanders/Commanders");
const Stats = require("./persist/stats/Stats");

const prettyPrintJSON = (json, logType = 'INFO') => {
    console.log(`[EVENTS.Ingest][${logType}]: \n${JSON.stringify(json, null, 4)}`);
}

exports.handler = arc.events.subscribe(async (payload, callback) => {
    prettyPrintJSON(payload);

    await Commanders.ingest(payload);
    await Stats.ingest(payload);
});
