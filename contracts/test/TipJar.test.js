import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseEther, getAddress } from "viem";

describe("TipJar", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClient = await viem.getWalletClient();
  
  let tipJar, tipToken, owner, user1, user2;

  beforeEach(async function () {
    // Get accounts
    const accounts = await walletClient.getAddresses();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];

    // Deploy TipToken
    tipToken = await viem.deployContract("TipToken");

    // Deploy TipJar
    tipJar = await viem.deployContract("TipJar");
  });

  describe("ETH Tips", function () {
    it("Should allow users to tip with ETH", async function () {
      const tipAmount = parseEther("0.1");
      
      await viem.assertions.emitWithArgs(
        tipJar.write.tip({ value: tipAmount, account: user1 }),
        tipJar,
        "Tipped",
        [user1, tipAmount, "0x0000000000000000000000000000000000000000"]
      );

      const totalTips = await tipJar.read.getTotalTipsByAddress([user1]);
      const totalReceived = await tipJar.read.totalTipsReceived();
      
      assert.equal(totalTips, tipAmount);
      assert.equal(totalReceived, tipAmount);
    });

    it("Should reject zero ETH tips", async function () {
      try {
        await tipJar.write.tip({ value: 0n, account: user1 });
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert(error.message.includes("Tip amount must be greater than 0"));
      }
    });

    it("Should track multiple tips from same user", async function () {
      const tip1 = parseEther("0.1");
      const tip2 = parseEther("0.05");

      await tipJar.write.tip({ value: tip1, account: user1 });
      await tipJar.write.tip({ value: tip2, account: user1 });

      const totalTips = await tipJar.read.getTotalTipsByAddress([user1]);
      const totalReceived = await tipJar.read.totalTipsReceived();
      
      assert.equal(totalTips, tip1 + tip2);
      assert.equal(totalReceived, tip1 + tip2);
    });
  });

  describe("Token Tips", function () {
    beforeEach(async function () {
      // Transfer some tokens to user1 and user2
      const tokenAmount = parseEther("1000");
      await tipToken.write.transfer([user1, tokenAmount]);
      await tipToken.write.transfer([user2, tokenAmount]);
    });

    it("Should allow users to tip with tokens", async function () {
      const tipAmount = parseEther("10");
      
      // Approve tokens first
      await tipToken.write.approve([tipJar.address, tipAmount], { account: user1 });
      
      await tipJar.write.tipWithToken([tipToken.address, tipAmount], { account: user1 });

      const tokenTips = await tipJar.read.getTokenTipsByAddress([user1, tipToken.address]);
      const totalTokenTips = await tipJar.read.totalTokenTipsReceived([tipToken.address]);
      
      assert.equal(tokenTips, tipAmount);
      assert.equal(totalTokenTips, tipAmount);
    });

    it("Should reject zero token tips", async function () {
      try {
        await tipJar.write.tipWithToken([tipToken.address, 0n], { account: user1 });
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert(error.message.includes("Tip amount must be greater than 0"));
      }
    });

    it("Should reject tips with zero token address", async function () {
      try {
        await tipJar.write.tipWithToken(["0x0000000000000000000000000000000000000000", parseEther("10")], { account: user1 });
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert(error.message.includes("Token address cannot be zero"));
      }
    });
  });

  describe("Withdrawals", function () {
    it("Should allow owner to withdraw ETH", async function () {
      const tipAmount = parseEther("0.1");
      await tipJar.write.tip({ value: tipAmount, account: user1 });

      const initialBalance = await publicClient.getBalance({ address: owner });
      await tipJar.write.withdrawETH();
      const finalBalance = await publicClient.getBalance({ address: owner });

      assert(finalBalance > initialBalance);
      
      const contractBalance = await tipJar.read.getETHBalance();
      assert.equal(contractBalance, 0n);
    });

    it("Should allow owner to withdraw tokens", async function () {
      const tipAmount = parseEther("10");
      
      // Transfer tokens to user1 and tip
      await tipToken.write.transfer([user1, tipAmount]);
      await tipToken.write.approve([tipJar.address, tipAmount], { account: user1 });
      await tipJar.write.tipWithToken([tipToken.address, tipAmount], { account: user1 });

      const initialBalance = await tipToken.read.balanceOf([owner]);
      await tipJar.write.withdrawToken([tipToken.address]);
      const finalBalance = await tipToken.read.balanceOf([owner]);

      assert.equal(finalBalance, initialBalance + tipAmount);
      
      const contractBalance = await tipJar.read.getTokenBalance([tipToken.address]);
      assert.equal(contractBalance, 0n);
    });

    it("Should reject withdrawals from non-owner", async function () {
      try {
        await tipJar.write.withdrawETH({ account: user1 });
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert(error.message.includes("OwnableUnauthorizedAccount"));
      }
    });
  });
});
