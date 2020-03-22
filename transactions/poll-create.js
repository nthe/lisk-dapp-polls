const {
    BaseTransaction,
    TransactionError
} = require('@liskhq/lisk-transactions');

class PollCreateTransaction extends BaseTransaction {

    static get TYPE() {
        return 21;
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
        if (!this.asset.option || typeof this.asset.option !== 'number') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.option" defined on transaction',
                    this.id,
                    '.asset.option',
                    this.asset.option,
                    'Expected int value',
                )
            );
        }
        return errors;
    }

    applyAsset(store) {
        const errors = [];
        const sender = store.account.get(this.senderId);

        // TODO:
        // 1) store poll on senders account
        // 2) restrict him from creating new poll

        if (sender.asset && sender.asset.option) {
            errors.push(
                new TransactionError(
                    'You cannot send a poll transaction multiple times',
                    this.id,
                    '.asset.option',
                    this.asset.option
                )
            );
        } else {
            const newObj = {
                ...sender,
                asset: {
                    // polls: {
                    //     [pollId]: option[]
                    // },
                    // votes: {
                    //     [pollId]: option
                    // }
                }
            };
            store.account.set(sender.address, newObj);
        }
        return errors;
    }

    undoAsset(store) {
        const errors = [];
        // const sender = store.account.get(this.senderId);
        // const oldObj = { ...sender, asset: null };
        // store.account.set(sender.address, oldObj);
        return errors;
    }
}

module.exports = PollCreateTransaction;
