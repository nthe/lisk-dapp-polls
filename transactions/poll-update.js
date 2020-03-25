const {
    BaseTransaction,
    TransactionError,
} = require('@liskhq/lisk-transactions')
const lodash = require('lodash')
const PollStates = require('./poll-states')

class PollUpdateTransaction extends BaseTransaction {
    static get TYPE() {
        return 23
    }

    static get FEE() {
        return '0'
    }

    async prepare(store) {
        await store.account.cache([
            {
                address: this.senderId,
            },
        ])
    }

    validateAsset() {
        const errors = []

        if (!this.asset.pollId || typeof this.asset.pollId !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.pollId" defined on transaction',
                    this.id,
                    '.asset.pollId',
                    this.asset.pollId,
                    'Expected string value'
                )
            )
        }

        return errors
    }

    applyAsset(store) {
        const errors = []
        const sender = store.account.get(this.senderId)

        const newObj = { ...sender }

        let poll = lodash.find(newObj.asset.polls, { id: this.asset.pollId })

        if (poll === undefined) {
            errors.push(
                new TransactionError(
                    'Sender does not own any the polls',
                    this.id,
                    '.asset.pollId',
                    this.asset.pollId
                )
            )
            return errors
        }

        if (poll.state === PollStates.CREATED) {
            poll.state = PollStates.OPENED
        } else if (poll.state === PollStates.OPENED) {
            poll.state = PollStates.CLOSED
        } else {
            errors.push(
                new TransactionError(
                    'Cannot update closed poll',
                    this.id,
                    '.asset.pollId',
                    this.asset.pollId
                )
            )
            return errors
        }

        const prev = lodash.filter(
            newObj.asset.polls,
            ({ id }) => id !== this.asset.pollId
        )
        newObj.asset.polls = [...prev, poll]

        store.account.set(sender.address, newObj)
        return errors
    }

    undoAsset(store) {
        const errors = []

        const sender = store.account.get(this.senderId)
        const newObj = { ...sender }

        const poll = lodash.find(newObj.asset.polls, { id: this.asset.pollId })

        switch (poll.state) {
            case PollStates.CLOSED:
                poll.state = PollStates.OPENED
                break
            case PollStates.OPENED:
                poll.state = PollStates.CREATED
                break
        }

        const prev = lodash.filter(
            newObj.asset.polls,
            ({ id }) => id !== this.asset.pollId
        )

        newObj.asset.polls = [...prev, poll]

        store.account.set(sender.address, newObj)
        return errors
    }
}

module.exports = PollUpdateTransaction
