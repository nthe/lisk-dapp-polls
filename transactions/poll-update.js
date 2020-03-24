const {
    BaseTransaction,
    TransactionError,
} = require('@liskhq/lisk-transactions')

class PollCreateTransaction extends BaseTransaction {
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

        // poll must have a title
        if (!this.asset.title || typeof this.asset.title !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.title" defined on transaction',
                    this.id,
                    '.asset.title',
                    this.asset.title,
                    'Expected string value'
                )
            )
        }

        // poll must have at least 2 options
        if (
            !this.asset.options ||
            this.asset.options.constructor !== Array ||
            this.asset.options.length < 2
        ) {
            errors.push(
                new TransactionError(
                    'Invalid "asset.options" defined on transaction',
                    this.id,
                    '.asset.options',
                    this.asset.options,
                    'Expected non-empty array'
                )
            )
        }
        return errors
    }

    applyAsset(store) {
        const errors = []
        const sender = store.account.get(this.senderId)

        // add new poll to polls list
        const newObj = { ...sender }
        newObj.asset.polls = newObj.asset.polls || []
        newObj.asset.polls.push({
            ...this.asset,
        })

        store.account.set(sender.address, newObj)
        return errors
    }

    undoAsset(store) {
        const errors = []
        const sender = store.account.get(this.senderId)
        const newObj = { ...sender }

        // remove poll based on pollId
        const filterFunc = item => item.pollId !== this.asset.pollId
        newObj.asset.polls = newObj.asset.polls.filter(filterFunc)

        store.account.set(sender.address, newObj)
        return errors
    }
}

module.exports = PollCreateTransaction
