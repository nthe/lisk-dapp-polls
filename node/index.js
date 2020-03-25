const { Application, configDevnet } = require('lisk-sdk')
const {
    PollUpdateTransaction,
    PollCreateTransaction,
    PollVoteTransaction,
} = require('../transactions')

const genesisBlock = require('./genesis-block.json')

configDevnet.app.label = 'lisk-dapp-polls'

const app = new Application(genesisBlock, configDevnet)

app.registerTransaction(PollUpdateTransaction)
app.registerTransaction(PollCreateTransaction)
app.registerTransaction(PollVoteTransaction)

app.run()
    .then(() => app.logger.info('App started...'))
    .catch(error => {
        console.error('Faced error in application', error)
        process.exit(0)
    })
