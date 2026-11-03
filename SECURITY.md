# Security notes

**This code has not been audited.** It is a learning project (written in 2025,
hardened in 2026) meant for a local Hardhat network or a public testnet. Do not deploy it to mainnet or use it with real funds.

This document lists what was reviewed in the 2026 pass, what changed, and the
known limitations.

## Scope

- `contracts/contracts/TipJar.sol`
- `contracts/contracts/TipToken.sol` (test token only)
- The transaction flow in the frontend (`frontend/src/components/TipJar.tsx`)

Contracts under `contracts/contracts/mocks/` exist only for tests.

## What was checked

| Area | Finding in the 2025 version | Status |
| --- | --- | --- |
| Reentrancy | `ReentrancyGuard` was present. ETH withdrawal emitted its event after the external call. | `nonReentrant` on `tipWithToken`, `withdrawETH`, `withdrawToken`. Events are emitted before external calls. Tests attack both paths with a malicious owner contract and a malicious ERC-20. `tip()` makes no external call, so it needs no guard. |
| Access control | `onlyOwner` on withdrawals; single-step `Ownable`; `renounceOwnership` available. | `Ownable2Step` (new owner must accept). `renounceOwnership` reverts, because renouncing would lock all funds. Owner is passed to the constructor. |
| ERC-20 handling | `require(token.transfer(...))`. Tokens that return no bool (for example USDT) would revert, and fee-on-transfer tokens would over-credit the tipper. | `SafeERC20` for all transfers. Tips record the balance delta actually received; a transfer that delivers 0 tokens reverts. Both cases are tested with mocks. |
| Input validation | Zero amount and zero token address checked on tips only. | Zero amount, zero token address, zero recipient and amount above balance are rejected on all state-changing functions, with custom errors. |
| Withdrawals | Always the full balance, always to `owner()`. | Owner chooses recipient and amount (pull-based: funds stay in the contract until the owner pulls them). A recipient that rejects ETH makes the call revert with `EthTransferFailed`, and funds stay in the contract. |
| Untracked ETH | No `receive()`, so plain transfers already reverted. | Explicit `receive()` that reverts with `DirectEthNotAccepted`, so every deposit goes through `tip()` and is accounted. |
| Events | One `Withdrawn` event for ETH and tokens, token emitted as non-indexed for ETH tips. | Separate `Tipped`, `TokenTipped`, `EthWithdrawn`, `TokenWithdrawn` events, plus OpenZeppelin ownership events. Every state change emits an event. |
| Errors and pragma | `require` strings, floating `^0.8.28`. | Custom errors, pragma pinned to `0.8.28`, named imports. |
| Frontend | Sent `approve` and `tipWithToken` back to back without waiting for the approval to be mined. | Approves the exact amount only when the allowance is too low, waits for each receipt, and shows errors. No unlimited approvals. |

## Tests

`npm test` in `contracts/` runs 44 tests (node:test + viem). `npm run coverage`
reports 100% line and statement coverage for `TipJar.sol` and `TipToken.sol`.
Removing the `nonReentrant` modifiers makes both reentrancy tests fail
(checked by hand during the review).

## Known limitations

- **Not audited.** No static analysis tool (Slither, Mythril) or fuzzing
  campaign has been run; that would be the next step.
- **Owner is fully trusted.** The owner can withdraw everything at any time.
  There is no timelock or multisig. That is the intended trust model for a
  personal tip jar.
- **Arbitrary tokens.** Any ERC-20 can be tipped. Accounting is keyed by the
  token address the caller passes, so a malicious token can report fake
  balances for its own entry. It cannot affect other tokens' totals or the
  ETH balance, and reentrancy from token hooks is blocked.
- **Rebasing tokens.** Balances of rebasing tokens can drift from the
  recorded totals. The totals are informational and withdrawals use the live
  balance, so funds are not stuck, but the numbers can disagree.
- **Forced ETH.** ETH can still be forced in (for example via
  `selfdestruct` from another contract). It is not counted in tip totals but
  can be withdrawn by the owner.
- **TipToken** has unlimited owner minting by design. It is a test token and
  has no value.
- **Frontend** has not been security reviewed beyond the transaction flow.
  It relies on the user's wallet to show what is being signed.

## Reporting

This is a personal learning project with no bug bounty. If you notice a
problem, please open a GitHub issue.
