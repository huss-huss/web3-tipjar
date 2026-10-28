import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress, parseEther } from "viem";

const { viem, networkHelpers } = await network.connect();

async function deployFixture() {
  const [owner, alice, bob] = await viem.getWalletClients();
  const tipToken = await viem.deployContract("TipToken", [owner.account.address]);
  return { tipToken, owner, alice, bob };
}

describe("TipToken", () => {
  it("has the expected metadata and initial supply", async () => {
    const { tipToken, owner } = await networkHelpers.loadFixture(deployFixture);
    assert.equal(await tipToken.read.name(), "Tip Token");
    assert.equal(await tipToken.read.symbol(), "TIP");
    assert.equal(await tipToken.read.decimals(), 18);
    assert.equal(await tipToken.read.totalSupply(), parseEther("1000000"));
    assert.equal(await tipToken.read.balanceOf([owner.account.address]), parseEther("1000000"));
  });

  it("lets the owner mint", async () => {
    const { tipToken, alice } = await networkHelpers.loadFixture(deployFixture);
    await tipToken.write.mint([alice.account.address, parseEther("5")]);
    assert.equal(await tipToken.read.balanceOf([alice.account.address]), parseEther("5"));
  });

  it("rejects mint from non-owners", async () => {
    const { tipToken, alice } = await networkHelpers.loadFixture(deployFixture);
    await viem.assertions.revertWithCustomErrorWithArgs(
      tipToken.write.mint([alice.account.address, 1n], { account: alice.account }),
      tipToken,
      "OwnableUnauthorizedAccount",
      [getAddress(alice.account.address)],
    );
  });

  it("batch mints to several recipients", async () => {
    const { tipToken, alice, bob } = await networkHelpers.loadFixture(deployFixture);
    await tipToken.write.batchMint([
      [alice.account.address, bob.account.address],
      [parseEther("1"), parseEther("2")],
    ]);
    assert.equal(await tipToken.read.balanceOf([alice.account.address]), parseEther("1"));
    assert.equal(await tipToken.read.balanceOf([bob.account.address]), parseEther("2"));
  });

  it("rejects batch mint with mismatched arrays", async () => {
    const { tipToken, alice } = await networkHelpers.loadFixture(deployFixture);
    await viem.assertions.revertWithCustomError(
      tipToken.write.batchMint([[alice.account.address], [1n, 2n]]),
      tipToken,
      "ArrayLengthMismatch",
    );
  });

  it("rejects batch mint from non-owners", async () => {
    const { tipToken, alice } = await networkHelpers.loadFixture(deployFixture);
    await viem.assertions.revertWithCustomError(
      tipToken.write.batchMint([[alice.account.address], [1n]], { account: alice.account }),
      tipToken,
      "OwnableUnauthorizedAccount",
    );
  });
});
