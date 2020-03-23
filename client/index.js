const uuid = require('uuid');
const express = require('express');
const bodyParser = require('body-parser');

const { api } = require('./helpers/api');
const TxFactory = require('./helpers/factory');

const {
  PollCreateTransaction,
  PollVoteTransaction
} = require('../transactions');

const PORT = 3000;
const app = express();

app.set('view engine', 'pug');
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const defaultPassPhrase = 'wagon stock borrow episode laundry kitten salute link globe zero feed marble';


const pprint = msg => console.log(JSON.stringify(msg, null, 2));

app.get('/', (res, req) => {
  req.redirect('/polls');
})

/**
 * Get list of polls.
 * GET @ /polls
 */
app.get('/polls', async (req, res) => {
  const query = {
    type: PollCreateTransaction.TYPE,
    offset: 0,
    limit: 20,
    sort: 'timestamp:desc'
  };

  const createdPollsTxs = await api.transactions.get(query);

  const createdPolls = createdPollsTxs.data
    .map(({ asset, senderId }) => ({ ...asset, owner: senderId }))

  res.render('polls', { polls: createdPolls });
});

/**
 * Get poll
 * Get @ /poll
 */
app.get('/poll', async (req, res) => {
  const query = {
    type: PollCreateTransaction.TYPE,
    offset: 0,
    limit: 20,
    sort: 'timestamp:desc',
    senderId: req.query.owner
  };

  try {
    const createdPollsTxs = await api.transactions.get(query);
    const txAssets = createdPollsTxs.data.map(({ asset }) => asset);
    const polls = txAssets.filter(({ id }) => id === req.query.pollId);

    if (polls.length === 0) {
      res.redirect('/polls');
    }
    
    const poll = polls[0];
    res.render('poll', { poll })
  }
  catch (err) {
    res.redirect('/polls');
  }
});

/**
 * Creates new poll.
 * POST @ /poll
 */
app.post('/poll', async (req, res) => {

  let options = req.body.options || [];
  options = options.map((o, id) => ({ id, text: o}));

  if (options.length < 2) {
    res.sendStatus(400);
  }

  const asset = {
    id: uuid.v1(), 
    title: req.body.title,
    options,
    timestamp: +new Date()
  };

  const response = await TxFactory(PollCreateTransaction)
  (
    asset,
    defaultPassPhrase
  );

  if (response == null) {
    res.sendStatus(400);
  }

  res.redirect('/polls');
});

/**
 * Get vote.
 * GET @ /vote
 */
app.get('/vote', async (req, res) => {
  const query = {
    type: PollVoteTransaction.TYPE,
    offset: 0,
    limit: 20,
    sort: 'timestamp:desc',
    // TODO: get sender from pass-phrase
    // address: req.body.senderId
  };

  const createdVotesTxs = await api.transactions.get(query);
  const createdVotes = createdVotesTxs.data.map(({ asset }) => asset)
  
  pprint(createdVotes);

  res.redirect('/polls');
});

/**
 * Creates or updates new vote.
 * POST @ /vote
 */
app.post('/vote', async (req, res) => {

  const asset = {
    pollId: req.body.pollId,
    // should be number
    optionId: +req.body.optionId,
    timestamp: +new Date()
  };

  const response = await TxFactory(PollVoteTransaction)
  (
    asset,
    defaultPassPhrase
  );

  if (response == null) {
    res.sendStatus(400);
  }

  // res.sendStatus(200);
  res.redirect('/polls');
});

app.listen(PORT, () => console.info(`Explorer app listening on port ${PORT}!`));