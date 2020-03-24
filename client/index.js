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
    const account = await api.accounts.get({ address: req.query.owner })
    if (!account.data || account.data.length === 0) {
        res.redirect('/polls')
        return
    }

    const polls = account.data[0].asset.polls.filter(
        ({ id }) => id === req.query.pollId
    )
    if (polls.length === 0) {
        res.redirect('/polls')
    }

    const poll = polls[0]
    res.render('poll', { poll })
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
