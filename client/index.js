const { APIClient } = require('@liskhq/lisk-api-client');
const { Mnemonic } = require('@liskhq/lisk-passphrase');
const cryptography = require('@liskhq/lisk-cryptography');
const PollCreateTransaction = require('../transactions/poll-create');

const networkIdentifier = cryptography.getNetworkIdentifier(
    "23ce0366ef0a14a91e5fd4b1591fc880ffbef9d988ff8bebf8f3666b0c09597d",
    "Lisk",
);

/* Utils */
const dateToLiskEpochTimestamp = date => (
    Math.floor(new Date(date).getTime() / 1000) - Math.floor(new Date(Date.UTC(2016, 4, 24, 17, 0, 0, 0)).getTime() / 1000)
);


const API_BASEURL = 'http://localhost:4000';
const api = new APIClient([API_BASEURL]);

const passphrase = Mnemonic.generateMnemonic();


const pollCreateTransaction = new PollCreateTransaction({
    asset: {
      option: 1
    },
    networkIdentifier: networkIdentifier,
    timestamp: dateToLiskEpochTimestamp(new Date()),
});

pollCreateTransaction.sign(passphrase);

api.transactions.broadcast(pollCreateTransaction.toJSON())
  .then(response => {
    res.app.locals.payload = {
        res: response.data,
        tx: pollCreateTransaction.toJSON(),
    };
    console.log("++++++++++++++++ API Response +++++++++++++++++");
    console.log(response.data);
    console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
    console.log(pollCreateTransaction.stringify());
    console.log("++++++++++++++++ End Script +++++++++++++++++");
  }).catch(err => {
    console.log(JSON.stringify(err.errors, null, 2));
  });