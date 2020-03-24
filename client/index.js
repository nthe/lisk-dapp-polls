const uuid = require('uuid');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
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

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Pretty-print object to console.
 * @param {object} msg 
 */
const pprint = msg => console.log(JSON.stringify(msg, null, 2));

/**
 * Middleware for passing of pass-phrase.
 */
app.use(passPhraseAuthMiddleware);

/**
 * Checks whether pass-phrase provided.
 * @param request
 * @returns bool
 */
function passPhraseAuthMiddleware(req, res, next) {

  const reqPassPhrase = req.body.passPhrase;
  const ckePassPhrase = req.cookies['passPhrase'];

  const reqPassValid = reqPassPhrase !== undefined &&
                       reqPassPhrase !== '';
  const ckePassValid = ckePassPhrase !== undefined &&
                       ckePassPhrase !== 'undefined' &&
                       ckePassPhrase !== '';

  if (req.method === 'GET' && req.url === '/login') {
    next();
    return;
  }

  if (req.method === 'POST' && req.url === '/login' && reqPassValid) {
    res.cookie('passPhrase', req.body.passPhrase);
    next();
    return;
  }
  
  if (!ckePassValid) {
    res.redirect('/login');
    return;
  }

  res.cookie('passPhrase', ckePassPhrase);
  next();
}

/**
 * Request root.
 */
app.get('/', (req, res) => {
  res.render('polls');
});

/**
 * Request login view.
 */
app.get('/login', (req, res) => {
  res.render('login');
});

/**
 * Perform login. 
 */
app.post('/login', (req, res) => {
  res.redirect('polls');
});

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
    req.body.passPhrase
  );

  if (response == null) {
    res.sendStatus(400);
  }

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
    req.body.passPhrase
  );

  if (response == null) {
    res.sendStatus(400);
  }

  res.redirect('/polls');
});

app.listen(PORT, () => console.info(`Explorer app listening on port ${PORT}!`));