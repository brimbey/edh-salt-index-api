const fetch = require('node-fetch');

const prettyPrintJSON = (json) => {
    console.log(`${JSON.stringify(json, null, 4)}`);
  }

exports.parse = async (url) => {
    const sha = url?.substring(url?.lastIndexOf(`/`) + 1);
    console.log(`USING MOXFIELD`);
    
    const requestOptions = {
        method: 'GET',
        redirect: 'follow',
        'maxRedirects': 20,
    };
    
    let response = await fetch(`https://api.moxfield.com/v2/decks/all/${sha}`, requestOptions);
    
    if (response.status !== 200) {
        throw ({ message: `ERROR: Deck URL invalid, or deck is not publicly visible`, code: 404} );
    }

    let text = await response.text();
    const json = JSON.parse(text);
    
    let legal = json?.format === "commander" && json?.mainboardCount === 100;
    console.log(`legal: ${legal}; format ${json?.format}, count: ${json?.mainboardCount}`);

    if (!legal) {
        throw ({ message: `ERROR: Deck does not contain exactly 100 cards`, code: 409} );
    }
    
    if (legal) {
        Object.keys(json?.mainboard).forEach((cardname) => {
            if (json.mainboard[cardname].card?.legalities?.commander !== "legal") {
                throw ({ message: `ERROR: Deck contains illegal card: ${cardname}`, code: 409} );
            }
        })
    }
    
    return {
        commanders: {
            ...json?.commanders,
        },
        cards: {
            ...json?.commanders,
            ...json?.mainboard,
        },
        author: {
            ...json?.createdByUser,
            url: `https://www.moxfield.com/users/${json?.createdByUser?.userName}`,
        },
        url: json?.publicUrl,
        name: json?.name,
        legal: legal,
        source: 'moxfield',
    }
}