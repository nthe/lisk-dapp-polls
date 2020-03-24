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
 * Get poll
 * Get @ /poll
 */
app.get('/poll', async (req, res) => {
    const accounts = await api.accounts.get({ address: req.query.owner })
    if (!accounts.data || accounts.data.length === 0) {
        res.redirect('/polls')
        return
    }

    const account = accounts.data[0]
    const polls = account.asset.polls.filter(
        ({ id }) => id === req.query.pollId
    )
    if (polls.length === 0) {
        res.redirect('/polls')
    }

    const poll = polls[0]
    res.render('poll', { poll, owner: account.address })
})

/**
 * Calculate statistics about specific poll.
 * GET @ /stats
 */
app.get('/stats', async (req, res) => {
    const { pollId, owner } = req.query

    let results = {},
        offset = 0,
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

            results[vote] = results[vote] === undefined ? 1 : results[vote]++
        }
        offset += 100
    } while (accounts.data && accounts.data.length === 100)

    res.render('stats', {
        labels: [...Object.keys(results)],
        data: [...Object.values(results)],
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
        id: uuid.v1(),
        title: req.body.title,
        options,
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
