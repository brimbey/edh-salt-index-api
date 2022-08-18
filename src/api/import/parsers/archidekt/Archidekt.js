const fetch = require('node-fetch');
const axios = require('axios').default;
const ImportErrorResponses = require('../../errors/ImportErrorResponses');

const prettyPrintJSON = (json) => {
    console.log(`${JSON.stringify(json, null, 4)}`);
  }

  const getAuthor = (data) => {
    return {
        profileImageUrl: data?.owner?.avatar,
        username: data?.owner?.username,
        url: `https://archidekt.com/user/${data?.owner?.id}`,
    }
  }
  
  const getCards = (data) => {
    const cards = {};
    data?.cards?.forEach((item) => {
        const name = item?.card?.oracleCard?.name;

        if (name) {
            cards[name] = name;
        }
    });

    return cards;
  }

  const getCommanders = (data) => {
    const cards = {};
    data?.cards?.forEach((item) => {
        if (item?.categories.includes("Commander")) {
            const name = item?.card?.oracleCard?.name;
            console.log(`FOUND COMMANDER :: ${name}`);

            if (name) {
                cards[name] = name;
            }
        }
    });

    return cards;
  }

  const getMetadata = (data) => {
    return {
        url: data?.url,
        name: data?.name,
        source: 'http://www.archidekt.com',
    }
  }

  const validate = (status, data) => {
    if (status !== 200) {
        // throw (ImportErrorResponses.errorStatuses.s404.notFound() );
    }

    // let legal = data?.format === "commander" && data?.mainboardCount === 100;

    // if (!legal) {
    //     throw (ImportErrorResponses.errorStatuses.s409.wrongSize());
    // } else {
    //     Object.keys(data?.mainboard).forEach((cardname) => {
    //         if (data.mainboard[cardname].card?.legalities?.commander !== "legal") {
    //             throw (ImportErrorResponses.errorStatuses.s409.illegalCard(cardname));
    //         }
    //     })
    // }
  }

exports.parse = async (url) => {
    console.log(`USING ARCHIDEKT`);
    console.log(`url :: ${url}`);
    const regex = /(?<=decks\/).*/;
    const match = regex.exec(url);
    // prettyPrintJSON(match);
    const id = match[0];
    
    const requestOptions = {
        method: 'GET',
        redirect: 'follow',
        'maxRedirects': 20,
    };
    
    var config = {
        method: 'get',
        url: `https://archidekt.com/api/decks/${id}/`,
        headers: { }
    };
      
    const response = await axios(config);
    const json = response.data;

    // prettyPrintJSON(json);
    
    // validate(response.status, json);
    console.log(`got it`);
    
    return {
        commanders: {
            ...getCommanders(json),
        },
        cards: {
            ...getCards(json),
        },
        author: getAuthor(json),
        ...getMetadata({
            ...json,
            url,
        }),
    }
}