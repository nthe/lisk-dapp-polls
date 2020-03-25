<p align="center" >
  <img src="./media/screen.png" width=600 style="border-radius: 16px; box-shadow: 0 0 4px #aaa">
</p>

# Decentralized voting app on Lisk

## Installation

Check out [Lisk SDK examples](https://github.com/LiskHQ/lisk-sdk-examples) and official [lisk.io documentation](https://lisk.io/documentation/lisk-sdk/index.html) for setup instructions.

## Description

Below is the short description of states and transactions.

### Poll states

Each poll is set to created when created. Closed poll cannot be re-opened. Polls and their results cannot be deleted.

1.**Created** state

-   everyone can view the poll
-   noone can vote
-   the owner can open the poll

2.**Opened** state

-   everyone can view the poll
-   everyone can vote and change their vote
-   noone can see the results
-   the owner can close the poll

3.**Closed** state

-   everyone can view the poll
-   everyone can display results
-   noone can change the vote

### Transactions

In order to achieve all mentioned states, three transactions were created.

-   create poll
-   update poll
-   vote

Polls and votes are stored on the senders account in following form.

```js
// PollState = [ "created", "opened", "closed" ]

{
  ...
  "address": string,
  "balance": BigNum,
  "asset": {
    "polls" [
      {
        "id": uuid,        // pollId
        "title": string,
        "options": [
          {
            "text": string,
            "id": int      // optionId
          }
        ],
        "state": PollState
      }
    ],
    "votes": {
      [pollId]: [optionId]
    }
  },
  ...
}

```
