const { api, networkIdentifier } = require('./api')

/**
 * Create and broadcast transaction.
 * @param {class} TxClass constructor
 * @param {object} asset transaction asset
 * @param {string} passPhrase signature
 */
const txFactory = TxClass => async (asset, passPhrase) => {
    const newTx = new TxClass({
        asset,
        networkIdentifier: networkIdentifier,
        timestamp: new Date(),
    })

    newTx.sign(passPhrase)

    try {
        return await api.transactions.broadcast(newTx.toJSON())
    } catch (err) {
        console.log(err)
        console.log(JSON.stringify(err.errors, null, 2))
        return null
    }
}

module.exports = txFactory
