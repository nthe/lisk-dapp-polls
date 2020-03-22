const { Application, genesisBlockDevnet, configDevnet} = require('lisk-sdk'); 
const PollCreateTransaction = require('../transactions/poll-create');

configDevnet.app.label = 'hello-world-blockchain-app';

const app = new Application(genesisBlockDevnet, configDevnet); 

app.registerTransaction(PollCreateTransaction);

app.run() 
   .then(() => app.logger.info('App started...')) 
   .catch(error => { 
        console.error('Faced error in application', error);
        process.exit(0);
});