const {
  BaseTransaction,
  TransactionError
} = require('@liskhq/lisk-transactions');

class CreatePollTransaction extends BaseTransaction {

  static get TYPE () {
    return 21;
  };

  static get FEE () {
    return 0;
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
    if (!this.asset.option || typeof this.asset.option !== 'string' || this.asset.option.length > 64) {
      errors.push(
        new TransactionError(
          'Invalid "asset.option" defined on transaction',
          this.id,
          '.asset.option',
          this.asset.option,
          'A string value no longer than 64 characters',
        )
      );
    }
    return errors;
  }

  applyAsset(store) {
        const errors = [];
        const sender = store.account.get(this.senderId);
        if (sender.asset && sender.asset.option) {
            errors.push(
                new TransactionError(
                    'You cannot send a poll transaction multiple times',
                    this.id,
                    '.asset.hello',
                    this.amount.toString()
                )
            );
        } else {
            const newObj = { ...sender, asset: { hello: this.asset.hello } };
            store.account.set(sender.address, newObj);
        }
        return errors; // array of TransactionErrors, returns empty array if no errors are thrown
  }

  undoAsset(store) {
    const sender = store.account.get(this.senderId);
    const oldObj = { ...sender, asset: null };
    store.account.set(sender.address, oldObj);
    return [];
  }
}

module.exports = CreatePollTransaction;
