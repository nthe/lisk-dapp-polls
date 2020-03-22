const {
  BaseTransaction,
  TransactionError
} = require('@liskhq/lisk-transactions');

class PollVoteTransaction extends BaseTransaction {

  static get TYPE() {
      return 26;
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
      if (!this.asset.pollId || typeof this.asset.pollId !== 'string') {
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
      return errors;
  }

  applyAsset(store) {
      const errors = [];
      const sender = store.account.get(this.senderId);
      const { option, pollId } = this.asset;

      const alreadyVoted = sender.asset && (sender.asset[pollId] != undefined);

      if (alreadyVoted) {
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
              [pollId]: option
            }
          };
          store.account.set(sender.address, newObj);
      }
      return errors;
  }

  undoAsset(store) {
      const errors = [];
      const sender = store.account.get(this.senderId);
      const { pollId } = this.asset;
      const oldObj = { ...sender };

      delete oldObj[pollId];

      store.account.set(sender.address, oldObj);
      return errors;
  }
}

module.exports = PollVoteTransaction;
