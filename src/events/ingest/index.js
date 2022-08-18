const Commanders = require("../../persist/commanders/Commanders");
let arc = require('@architect/functions')

exports.handler = arc.events.subscribe(async (payload, callback) => {
    try {
        Commanders.ingest(payload);
    } catch (error) {
        console.log(`[ERROR] - ingest queue failed: ${JSON.stringify(error)}`);
    }
});
