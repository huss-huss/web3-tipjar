import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress, parseEther, toFunctionSelector, zeroAddress } from "viem";

const { viem, networkHelpers } = await network.connect();

const REENTRANCY_SELECTOR = toFunctionSelector("ReentrancyGuardReentrantCall()");

async function deployFixture() {
  const [owner, alice, bob, mallory] = await viem.getWalletClients();

  const tipJar = await viem.deployContract("TipJar", [owner.account.address]);
  const tipToken = await viem.deployContract("TipToken", [owner.account.address]);

  // Give alice and bob some tokens to tip with.
  await tipToken.write.transfer([alice.account.address, parseEther("1000")]);
  await tipToken.write.transfer([bob.account.address, parseEther("1000")]);

  return { tipJar, tipToken, owner, alice, bob, mallory };
}

async function ethFundedFixture() {
  const f = await deployFixture();
  await f.tipJar.write.tip({ value: parseEther("3"), account: f.alice.account });
  return f;
}

async function tokenFundedFixture() {
  const f = await deployFixture();
  await f.tipToken.write.approve([f.tipJar.address, parseEther("50")], { account: f.alice.account });
  await f.tipJar.write.tipWithToken([f.tipToken.address, parseEther("50")], {
    account: f.alice.account,
  });
  return f;
}

describe("TipJar", () => {
  describe("deployment", () => {
    it("sets the initial owner", async () => {
      const { tipJar, owner } = await networkHelpers.loadFixture(deployFixture);
      assert.equal(await tipJar.read.owner(), getAddress(owner.account.address));
    });

    it("starts with zero totals and balance", async () => {
      const { tipJar } = await networkHelpers.loadFixture(deployFixture);
      assert.equal(await tipJar.read.totalTipsReceived(), 0n);
      assert.equal(await tipJar.read.getETHBalance(), 0n);
    });

    it("reverts when the initial owner is the zero address", async () => {
      const { tipJar } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.revertWithCustomErrorWithArgs(
        viem.deployContract("TipJar", [zeroAddress]),
        tipJar,
        "OwnableInvalidOwner",
        [zeroAddress],
      );
    });
  });

  describe("ETH tips", () => {
    it("emits Tipped and records the tip", async () => {
      const { tipJar, alice } = await networkHelpers.loadFixture(deployFixture);
      const amount = parseEther("0.1");

      await viem.assertions.emitWithArgs(
        tipJar.write.tip({ value: amount, account: alice.account }),
        tipJar,
        "Tipped",
        [getAddress(alice.account.address), amount],
      );

      assert.equal(await tipJar.read.getTotalTipsByAddress([alice.account.address]), amount);
      assert.equal(await tipJar.read.totalTipsReceived(), amount);
      assert.equal(await tipJar.read.getETHBalance(), amount);
    });

    it("accumulates tips per address and in total", async () => {
      const { tipJar, alice, bob } = await networkHelpers.loadFixture(deployFixture);

      await tipJar.write.tip({ value: parseEther("0.1"), account: alice.account });
      await tipJar.write.tip({ value: parseEther("0.05"), account: alice.account });
      await tipJar.write.tip({ value: parseEther("1"), account: bob.account });

      assert.equal(await tipJar.read.totalTipsByAddress([alice.account.address]), parseEther("0.15"));
      assert.equal(await tipJar.read.totalTipsByAddress([bob.account.address]), parseEther("1"));
      assert.equal(await tipJar.read.totalTipsReceived(), parseEther("1.15"));
    });

    it("moves ETH from the tipper to the contract", async () => {
      const { tipJar, alice } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.balancesHaveChanged(
        tipJar.write.tip({ value: parseEther("2"), account: alice.account }),
        [{ address: tipJar.address, amount: parseEther("2") }],
      );
    });

    it("reverts on a zero-value tip", async () => {
      const { tipJar, alice } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.write.tip({ value: 0n, account: alice.account }),
        tipJar,
        "ZeroAmount",
      );
    });

    it("rejects plain ETH transfers that bypass tip()", async () => {
      const { tipJar, alice } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.revertWithCustomError(
        alice.sendTransaction({ to: tipJar.address, value: parseEther("1") }),
        tipJar,
        "DirectEthNotAccepted",
      );
    });
  });

  describe("token tips", () => {
    it("transfers tokens, emits TokenTipped and records the tip", async () => {
      const { tipJar, tipToken, alice } = await networkHelpers.loadFixture(deployFixture);
      const amount = parseEther("10");

      await tipToken.write.approve([tipJar.address, amount], { account: alice.account });
      await viem.assertions.emitWithArgs(
        tipJar.write.tipWithToken([tipToken.address, amount], { account: alice.account }),
        tipJar,
        "TokenTipped",
        [getAddress(alice.account.address), getAddress(tipToken.address), amount],
      );

      assert.equal(
        await tipJar.read.getTokenTipsByAddress([alice.account.address, tipToken.address]),
        amount,
      );
      assert.equal(await tipJar.read.totalTokenTipsReceived([tipToken.address]), amount);
      assert.equal(await tipJar.read.getTokenBalance([tipToken.address]), amount);
      assert.equal(await tipToken.read.balanceOf([alice.account.address]), parseEther("990"));
    });

    it("reverts on a zero amount", async () => {
      const { tipJar, tipToken, alice } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.write.tipWithToken([tipToken.address, 0n], { account: alice.account }),
        tipJar,
        "ZeroAmount",
      );
    });

    it("reverts on the zero token address", async () => {
      const { tipJar, alice } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.write.tipWithToken([zeroAddress, parseEther("1")], { account: alice.account }),
        tipJar,
        "ZeroAddress",
      );
    });

    it("reverts without a sufficient allowance", async () => {
      const { tipJar, tipToken, alice } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.revertWithCustomErrorWithArgs(
        tipJar.write.tipWithToken([tipToken.address, parseEther("1")], { account: alice.account }),
        tipToken,
        "ERC20InsufficientAllowance",
        [getAddress(tipJar.address), 0n, parseEther("1")],
      );
    });

    it("reverts when the token address has no code", async () => {
      const { tipJar, alice, bob } = await networkHelpers.loadFixture(deployFixture);
      await assert.rejects(
        tipJar.write.tipWithToken([bob.account.address, parseEther("1")], { account: alice.account }),
      );
    });

    it("records the amount actually received for fee-on-transfer tokens", async () => {
      const { tipJar, alice } = await networkHelpers.loadFixture(deployFixture);
      const feeToken = await viem.deployContract("FeeOnTransferToken", [100n]); // 1% fee
      await feeToken.write.transfer([alice.account.address, parseEther("1000")]);
      assert.equal(await feeToken.read.balanceOf([alice.account.address]), parseEther("990"));

      await feeToken.write.approve([tipJar.address, parseEther("100")], { account: alice.account });
      await viem.assertions.emitWithArgs(
        tipJar.write.tipWithToken([feeToken.address, parseEther("100")], { account: alice.account }),
        tipJar,
        "TokenTipped",
        [getAddress(alice.account.address), getAddress(feeToken.address), parseEther("99")],
      );

      assert.equal(
        await tipJar.read.tokenTipsByAddress([alice.account.address, feeToken.address]),
        parseEther("99"),
      );
      assert.equal(await tipJar.read.getTokenBalance([feeToken.address]), parseEther("99"));
    });

    it("reverts when the jar receives nothing (100% fee token)", async () => {
      const { tipJar, alice } = await networkHelpers.loadFixture(deployFixture);
      const feeToken = await viem.deployContract("FeeOnTransferToken", [10_000n]);
      await feeToken.write.approve([tipJar.address, parseEther("1")]);
      await viem.assertions.revertWithCustomError(
        tipJar.write.tipWithToken([feeToken.address, parseEther("1")]),
        tipJar,
        "ZeroAmount",
      );
      assert.equal(await tipJar.read.getTokenBalance([feeToken.address]), 0n);
      assert.equal(await tipJar.read.tokenTipsByAddress([alice.account.address, feeToken.address]), 0n);
    });

    it("supports tokens that do not return a bool (SafeERC20)", async () => {
      const { tipJar, alice } = await networkHelpers.loadFixture(deployFixture);
      const token = await viem.deployContract("NoReturnToken");

      await token.write.approve([tipJar.address, parseEther("5")]);
      await tipJar.write.tipWithToken([token.address, parseEther("5")]);
      assert.equal(await tipJar.read.getTokenBalance([token.address]), parseEther("5"));

      await tipJar.write.withdrawToken([token.address, alice.account.address, parseEther("5")]);
      assert.equal(await token.read.balanceOf([alice.account.address]), parseEther("5"));
    });
  });

  describe("ETH withdrawals", () => {
    it("lets the owner withdraw part of the balance to a recipient", async () => {
      const { tipJar, bob } = await networkHelpers.loadFixture(ethFundedFixture);
      const amount = parseEther("1");

      await viem.assertions.balancesHaveChanged(
        tipJar.write.withdrawETH([bob.account.address, amount]),
        [
          { address: bob.account.address, amount },
          { address: tipJar.address, amount: -amount },
        ],
      );
      assert.equal(await tipJar.read.getETHBalance(), parseEther("2"));
    });

    it("emits EthWithdrawn", async () => {
      const { tipJar, bob } = await networkHelpers.loadFixture(ethFundedFixture);
      await viem.assertions.emitWithArgs(
        tipJar.write.withdrawETH([bob.account.address, parseEther("3")]),
        tipJar,
        "EthWithdrawn",
        [getAddress(bob.account.address), parseEther("3")],
      );
      assert.equal(await tipJar.read.getETHBalance(), 0n);
    });

    it("does not reduce the lifetime tip totals", async () => {
      const { tipJar, bob, alice } = await networkHelpers.loadFixture(ethFundedFixture);
      await tipJar.write.withdrawETH([bob.account.address, parseEther("3")]);
      assert.equal(await tipJar.read.totalTipsReceived(), parseEther("3"));
      assert.equal(await tipJar.read.totalTipsByAddress([alice.account.address]), parseEther("3"));
    });

    it("reverts for non-owners", async () => {
      const { tipJar, mallory } = await networkHelpers.loadFixture(ethFundedFixture);
      await viem.assertions.revertWithCustomErrorWithArgs(
        tipJar.write.withdrawETH([mallory.account.address, parseEther("1")], {
          account: mallory.account,
        }),
        tipJar,
        "OwnableUnauthorizedAccount",
        [getAddress(mallory.account.address)],
      );
    });

    it("reverts on the zero recipient", async () => {
      const { tipJar } = await networkHelpers.loadFixture(ethFundedFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.write.withdrawETH([zeroAddress, parseEther("1")]),
        tipJar,
        "ZeroAddress",
      );
    });

    it("reverts on a zero amount", async () => {
      const { tipJar, bob } = await networkHelpers.loadFixture(ethFundedFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.write.withdrawETH([bob.account.address, 0n]),
        tipJar,
        "ZeroAmount",
      );
    });

    it("reverts when withdrawing more than the balance", async () => {
      const { tipJar, bob } = await networkHelpers.loadFixture(ethFundedFixture);
      await viem.assertions.revertWithCustomErrorWithArgs(
        tipJar.write.withdrawETH([bob.account.address, parseEther("4")]),
        tipJar,
        "InsufficientBalance",
        [parseEther("4"), parseEther("3")],
      );
    });

    it("reverts and keeps funds when the recipient rejects ETH", async () => {
      const { tipJar } = await networkHelpers.loadFixture(ethFundedFixture);
      const rejecter = await viem.deployContract("EthRejecter");
      await viem.assertions.revertWithCustomError(
        tipJar.write.withdrawETH([rejecter.address, parseEther("1")]),
        tipJar,
        "EthTransferFailed",
      );
      assert.equal(await tipJar.read.getETHBalance(), parseEther("3"));
    });
  });

  describe("token withdrawals", () => {
    it("lets the owner withdraw tokens to a recipient and emits TokenWithdrawn", async () => {
      const { tipJar, tipToken, bob } = await networkHelpers.loadFixture(tokenFundedFixture);
      await viem.assertions.emitWithArgs(
        tipJar.write.withdrawToken([tipToken.address, bob.account.address, parseEther("20")]),
        tipJar,
        "TokenWithdrawn",
        [getAddress(tipToken.address), getAddress(bob.account.address), parseEther("20")],
      );
      assert.equal(await tipToken.read.balanceOf([bob.account.address]), parseEther("1020"));
      assert.equal(await tipJar.read.getTokenBalance([tipToken.address]), parseEther("30"));
      assert.equal(await tipJar.read.totalTokenTipsReceived([tipToken.address]), parseEther("50"));
    });

    it("reverts for non-owners", async () => {
      const { tipJar, tipToken, mallory } = await networkHelpers.loadFixture(tokenFundedFixture);
      await viem.assertions.revertWithCustomErrorWithArgs(
        tipJar.write.withdrawToken([tipToken.address, mallory.account.address, 1n], {
          account: mallory.account,
        }),
        tipJar,
        "OwnableUnauthorizedAccount",
        [getAddress(mallory.account.address)],
      );
    });

    it("reverts on the zero token or recipient address", async () => {
      const { tipJar, tipToken, bob } = await networkHelpers.loadFixture(tokenFundedFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.write.withdrawToken([zeroAddress, bob.account.address, 1n]),
        tipJar,
        "ZeroAddress",
      );
      await viem.assertions.revertWithCustomError(
        tipJar.write.withdrawToken([tipToken.address, zeroAddress, 1n]),
        tipJar,
        "ZeroAddress",
      );
    });

    it("reverts on a zero amount", async () => {
      const { tipJar, tipToken, bob } = await networkHelpers.loadFixture(tokenFundedFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.write.withdrawToken([tipToken.address, bob.account.address, 0n]),
        tipJar,
        "ZeroAmount",
      );
    });

    it("reverts when withdrawing more than the balance", async () => {
      const { tipJar, tipToken, bob } = await networkHelpers.loadFixture(tokenFundedFixture);
      await viem.assertions.revertWithCustomErrorWithArgs(
        tipJar.write.withdrawToken([tipToken.address, bob.account.address, parseEther("51")]),
        tipJar,
        "InsufficientBalance",
        [parseEther("51"), parseEther("50")],
      );
    });
  });

  describe("reentrancy", () => {
    it("blocks a malicious owner contract from re-entering withdrawETH", async () => {
      const { tipJar, alice } = await networkHelpers.loadFixture(deployFixture);
      const attacker = await viem.deployContract("ReentrantOwner", [tipJar.address]);
      await tipJar.write.transferOwnership([attacker.address]);
      await attacker.write.acceptOwnership();
      assert.equal(await tipJar.read.owner(), getAddress(attacker.address));

      await tipJar.write.tip({ value: parseEther("1"), account: alice.account });
      await attacker.write.attack([parseEther("0.4")]);

      assert.equal(await attacker.read.reentryAttempted(), true);
      assert.equal(await attacker.read.reentrySucceeded(), false);
      assert.equal(await attacker.read.reentryRevertData(), REENTRANCY_SELECTOR);
      assert.equal(await tipJar.read.getETHBalance(), parseEther("0.6"));
    });

    it("blocks a malicious token from re-entering tipWithToken", async () => {
      const { tipJar, alice } = await networkHelpers.loadFixture(deployFixture);
      const evilToken = await viem.deployContract("ReentrantToken", [tipJar.address]);
      await evilToken.write.transfer([alice.account.address, parseEther("100")]);
      await evilToken.write.approve([tipJar.address, parseEther("100")], { account: alice.account });

      await tipJar.write.tipWithToken([evilToken.address, parseEther("10")], { account: alice.account });

      assert.equal(await evilToken.read.reentryAttempted(), true);
      assert.equal(await evilToken.read.reentrySucceeded(), false);
      assert.equal(await evilToken.read.reentryRevertData(), REENTRANCY_SELECTOR);
      assert.equal(
        await tipJar.read.tokenTipsByAddress([alice.account.address, evilToken.address]),
        parseEther("10"),
      );
      assert.equal(await tipJar.read.tokenTipsByAddress([evilToken.address, evilToken.address]), 0n);
    });
  });

  describe("ownership", () => {
    it("uses a two-step transfer", async () => {
      const { tipJar, owner, bob } = await networkHelpers.loadFixture(deployFixture);

      await viem.assertions.emitWithArgs(
        tipJar.write.transferOwnership([bob.account.address]),
        tipJar,
        "OwnershipTransferStarted",
        [getAddress(owner.account.address), getAddress(bob.account.address)],
      );
      assert.equal(await tipJar.read.owner(), getAddress(owner.account.address));
      assert.equal(await tipJar.read.pendingOwner(), getAddress(bob.account.address));

      await viem.assertions.emitWithArgs(
        tipJar.write.acceptOwnership({ account: bob.account }),
        tipJar,
        "OwnershipTransferred",
        [getAddress(owner.account.address), getAddress(bob.account.address)],
      );
      assert.equal(await tipJar.read.owner(), getAddress(bob.account.address));
    });

    it("moves withdrawal rights to the new owner", async () => {
      const { tipJar, owner, alice, bob } = await networkHelpers.loadFixture(deployFixture);
      await tipJar.write.tip({ value: parseEther("1"), account: alice.account });
      await tipJar.write.transferOwnership([bob.account.address]);
      await tipJar.write.acceptOwnership({ account: bob.account });

      await viem.assertions.revertWithCustomError(
        tipJar.write.withdrawETH([owner.account.address, parseEther("1")]),
        tipJar,
        "OwnableUnauthorizedAccount",
      );
      await tipJar.write.withdrawETH([bob.account.address, parseEther("1")], { account: bob.account });
      assert.equal(await tipJar.read.getETHBalance(), 0n);
    });

    it("only lets the pending owner accept", async () => {
      const { tipJar, bob, mallory } = await networkHelpers.loadFixture(deployFixture);
      await tipJar.write.transferOwnership([bob.account.address]);
      await viem.assertions.revertWithCustomErrorWithArgs(
        tipJar.write.acceptOwnership({ account: mallory.account }),
        tipJar,
        "OwnableUnauthorizedAccount",
        [getAddress(mallory.account.address)],
      );
    });

    it("only lets the owner start a transfer", async () => {
      const { tipJar, mallory } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.write.transferOwnership([mallory.account.address], { account: mallory.account }),
        tipJar,
        "OwnableUnauthorizedAccount",
      );
    });

    it("cannot be renounced", async () => {
      const { tipJar, owner } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.read.renounceOwnership(),
        tipJar,
        "RenounceOwnershipDisabled",
      );
      assert.equal(await tipJar.read.owner(), getAddress(owner.account.address));
    });

    it("rejects renounce from non-owners with the ownership error", async () => {
      const { tipJar, mallory } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.read.renounceOwnership({ account: mallory.account.address }),
        tipJar,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("views", () => {
    it("getTokenBalance reverts on the zero address", async () => {
      const { tipJar } = await networkHelpers.loadFixture(deployFixture);
      await viem.assertions.revertWithCustomError(
        tipJar.read.getTokenBalance([zeroAddress]),
        tipJar,
        "ZeroAddress",
      );
    });
  });
});
