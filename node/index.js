const {
  Application,
  genesisBlockDevnet,
  configDevnet
} = require('lisk-sdk');
const {
  PollCreateTransaction,
  PollVoteTransaction
} = require('../transactions');

configDevnet.app.label = 'lisk-dapp-polls';

const app = new Application(genesisBlockDevnet, configDevnet);

app.registerTransaction(PollCreateTransaction);
app.registerTransaction(PollVoteTransaction);

app.run()
  .then(() => app.logger.info('App started...'))
  .catch(error => {
    console.error('Faced error in application', error);
    process.exit(0);
  });