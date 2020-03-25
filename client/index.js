const uuid = require('uuid')
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { api } = require('./helpers/api')
const TxFactory = require('./helpers/factory')
const cryptography = require('@liskhq/lisk-cryptography')
const {
    PollCreateTransaction,
    PollVoteTransaction,
} = require('../transactions')

const PORT = 3000
const app = express()

app.set('view engine', 'pug')
app.use(express.static('public'))

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const SECRET = 'secret key of decentralized lisk voting applcation'

/**
 * Pretty-print object to console.
 * @param {object} msg
 */
const pprint = msg => console.log(JSON.stringify(msg, null, 2))

/**
 * Middleware for passing of pass-phrase.
 */
app.use(passPhraseAuthMiddleware)

/**
 * Checks whether pass-phrase provided.
 */
function passPhraseAuthMiddleware(req, res, next) {
    const reqPassPhrase = req.body.passPhrase
    const ckePassPhrase = req.cookies['passPhrase']

    const reqPassValid = reqPassPhrase !== undefined && reqPassPhrase !== ''
    const ckePassValid =
        ckePassPhrase !== undefined &&
        ckePassPhrase !== 'undefined' &&
        ckePassPhrase !== ''

    if (req.method === 'GET' && req.url === '/login') {
        next()
        return
    }

    if (req.method === 'POST' && req.url === '/login' && reqPassValid) {
        const encCookie = cryptography.encryptPassphraseWithPassword(
            reqPassPhrase,
            SECRET
        )
        const strCookie = cryptography.stringifyEncryptedPassphrase(encCookie)
        res.cookie('passPhrase', strCookie)
        next()
        return
    }

    if (!ckePassValid) {
        res.redirect('/login')
        return
    }

    res.cookie('passPhrase', ckePassPhrase)
    next()
}

/**
 * Request root.
 */
app.get('/', (req, res) => {
    res.render('login')
})

/**
 * Request login view.
 */
app.get('/login', (req, res) => {
    res.render('login')
})

/**
 * Perform login.
 */
app.post('/login', (req, res) => {
    res.redirect('polls')
})

/**
 * Get list of polls.
 * GET @ /polls
 */
app.get('/polls', async (req, res) => {
    let polls = [],
        offset = 0,
        accounts = {}

    do {
        accounts = await api.accounts.get({ limit: 100, offset })

        for (let { asset, address } of accounts.data) {
            if (asset.polls === undefined) {
                continue
            }
            for (let poll of asset.polls) {
                polls.push({
                    ...poll,
                    owner: address,
                })
            }
        }
        offset += 100
    } while (accounts.data && accounts.data.length === 100)

    res.render('polls', { polls })
})

/**
 * Fetch specific poll from blockchain.
 * @param {string} address address of owner
 * @param {string} pollId id of poll
 */
async function fetchPoll(address, pollId) {
    const accounts = await api.accounts.get({ address })
    if (!accounts.data || accounts.data.length === 0) {
        return
    }

    const account = accounts.data[0]
    const polls = account.asset.polls.filter(({ id }) => id === pollId)
    if (polls.length === 0) {
        return
    }

    const poll = polls[0]
    return {
        poll,
        account,
    }
}

/**
 * Get poll
 * Get @ /poll
 */
app.get('/poll', async (req, res) => {
    const { poll, account } = await fetchPoll(req.query.owner, req.query.pollId)
    if (poll === undefined) {
        res.redirect('/polls')
        return
    }
    res.render('poll', { poll, owner: account.address })
})

/**
 * Calculate statistics about specific poll.
 * GET @ /stats
 */
app.get('/stats', async (req, res) => {
    const { pollId, owner } = req.query

    const { poll } = await fetchPoll(req.query.owner, req.query.pollId)
    const { title, options } = poll

    const lookup = options.reduce((acc, cur) => {
        const { id, text } = cur
        acc[id] = { text, count: Math.round(Math.random() * 100) }
        return acc
    }, {})

    let offset = 0,
        accounts = {}

    do {
        accounts = await api.accounts.get({ limit: 100, offset })

        for (let { asset } of accounts.data) {
            if (asset.votes === undefined) {
                continue
            }

            const vote = asset.votes[pollId]
            if (vote === undefined) {
                continue
            }

            lookup[vote].count += 1
        }
        offset += 100
    } while (accounts.data && accounts.data.length === 100)

    res.render('stats', {
        lookup: JSON.stringify(Object.values(lookup)),
        title,
        pollId,
        owner,
    })
})

/**
 * Creates new poll.
 * POST @ /poll
 */
app.post('/poll', async (req, res) => {
    let options = req.body.options || []
    options = options.map((o, id) => ({ id, text: o }))

    if (options.length < 2) {
        res.sendStatus(400)
    }

    const asset = {
        options,
        id: uuid.v1(),
        isOpen: true,
        title: req.body.title,
        timestamp: +new Date(),
    }

    const encPassPhrase = cryptography.parseEncryptedPassphrase(
        req.cookies['passPhrase']
    )
    const passPhrase = cryptography.decryptPassphraseWithPassword(
        encPassPhrase,
        SECRET
    )

    const response = await TxFactory(PollCreateTransaction)(asset, passPhrase)

    if (response == null) {
        res.sendStatus(400)
    }

    res.redirect('/polls')
})

/**
 * Creates or updates new vote.
 * POST @ /vote
 */
app.post('/vote', async (req, res) => {
    const asset = {
        owner: req.body.owner,
        pollId: req.body.pollId,
        // should be number
        optionId: +req.body.optionId,
        timestamp: +new Date(),
    }

    const encPassPhrase = cryptography.parseEncryptedPassphrase(
        req.cookies['passPhrase']
    )
    const passPhrase = cryptography.decryptPassphraseWithPassword(
        encPassPhrase,
        SECRET
    )

    const response = await TxFactory(PollVoteTransaction)(asset, passPhrase)

    if (response == null) {
        res.sendStatus(400)
    }

    res.redirect('/polls')
})

app.listen(PORT, () => console.info(`Explorer app listening on port ${PORT}!`))
