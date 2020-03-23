const { APIClient } = require('@liskhq/lisk-api-client');
const cryptography = require('@liskhq/lisk-cryptography');

const networkIdentifier = cryptography.getNetworkIdentifier(
  "23ce0366ef0a14a91e5fd4b1591fc880ffbef9d988ff8bebf8f3666b0c09597d",
  "Lisk",
);

const API_BASEURL = 'http://localhost:4000';
const api = new APIClient([API_BASEURL]);

module.exports = {
  api,
  networkIdentifier
}
