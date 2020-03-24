const {
    BaseTransaction,
    TransactionError
} = require('@liskhq/lisk-transactions');

class PollVoteTransaction extends BaseTransaction {

    static get TYPE() {
        return 22;
    };

    static get FEE() {
        return '0';
    };

    async prepare(store) {
        await store.account.cache([
            {
                address: this.senderId,
            },
        ]);
    }

    validateAsset() {
        const errors = [];

        if (!this.asset.pollId
            || typeof this.asset.pollId !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.pollId" defined on transaction',
                    this.id,
                    '.asset.pollId',
                    this.asset.pollId,
                    'Expected string value',
                )
            );
        }

        if (this.asset.optionId === undefined
            || typeof this.asset.optionId !== 'number') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.optionId" defined on transaction',
                    this.id,
                    '.asset.optionId',
                    this.asset.optionId,
                    'Expected int value',
                )
            );
        }
        return errors;
    }

    applyAsset(store) {
        const errors = [];
        const sender = store.account.get(this.senderId);

        const newObj = { ...sender };
        const { option, pollId } = this.asset;

        newObj.asset.votes = newObj.asset.votes || {};
        newObj.asset.votes[pollId] = option;
        
        store.account.set(sender.address, newObj);

        return errors;
    }

    undoAsset(store) {
        const errors = [];
        const sender = store.account.get(this.senderId);

        const newObj = { ...sender };
        const { pollId } = this.asset;

        newObj.asset.votes = newObj.asset.votes || {};
        delete newObj.asset.votes[pollId];

        store.account.set(sender.address, newObj);
        return errors;
    }
}

module.exports = PollVoteTransaction;
