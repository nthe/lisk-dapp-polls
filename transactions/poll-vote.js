const {
    BaseTransaction,
    TransactionError,
} = require('@liskhq/lisk-transactions')
const lodash = require('lodash')

class PollVoteTransaction extends BaseTransaction {
    static get TYPE() {
        return 22
    }

    static get FEE() {
        return '0'
    }

    async prepare(store) {
        await store.account.cache([
            {
                address: this.senderId,
            },
            {
                address: this.asset.owner,
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

        if (
            this.asset.optionId === undefined ||
            typeof this.asset.optionId !== 'number'
        ) {
            errors.push(
                new TransactionError(
                    'Invalid "asset.optionId" defined on transaction',
                    this.id,
                    '.asset.optionId',
                    this.asset.optionId,
                    'Expected int value'
                )
            )
        }
        return errors
    }

    applyAsset(store) {
        const errors = []
        const sender = store.account.get(this.senderId)
        const owner = store.account.get(this.asset.owner)
        const poll = lodash.find(owner.asset.polls, { id: this.asset.pollId })

        // if (!poll.isOpen) {
        //     errors.push(
        //         new TransactionError('Cannot vote in closed poll', this.id)
        //     )
        //     return errors
        // }

        const newObj = { ...sender }
        const { optionId, pollId } = this.asset

        newObj.asset.votes = newObj.asset.votes || {}
        newObj.asset.votes[pollId] = optionId

        store.account.set(sender.address, newObj)
        return errors
    }

    undoAsset(store) {
        const errors = []
        const sender = store.account.get(this.senderId)

        const newObj = { ...sender }
        const { pollId } = this.asset

        newObj.asset.votes = newObj.asset.votes || {}
        delete newObj.asset.votes[pollId]

        store.account.set(sender.address, newObj)
        return errors
    }
}

module.exports = PollVoteTransaction
