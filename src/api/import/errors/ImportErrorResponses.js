exports.errorStatuses = {
    s409: {
        genericIllegal: () => {
            return {
                message: `ERROR: This deck is not Commander/EDH legal`, 
                code: 409,
            }
        },
        wrongSize: () => {
            return {
                message: `ERROR: Deck does not contain exactly 100 cards`, 
                code: 409,
            }
        },
        illegalCard: (cardname) => {
            return {
                message: `ERROR: Deck contains illegal card: ${cardname}`, 
                code: 409,
            }
        },
    },
    s404: {
        notFound: () => {
            return {
                message: `ERROR: Deck URL invalid, or deck is not publicly visible`, 
                code: 404,
            }
        }
    }
}
