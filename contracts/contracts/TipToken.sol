// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TipToken
 * @notice Simple ERC-20 used to exercise token tips on local and test networks.
 * @dev Test token only: the owner can mint without limit. Do not treat it as
 *      a token with any value.
 */
contract TipToken is ERC20, Ownable {
    error ArrayLengthMismatch();

    constructor(address initialOwner) ERC20("Tip Token", "TIP") Ownable(initialOwner) {
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    /// @notice Mint tokens to `to` (owner only).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Mint tokens to several addresses (owner only).
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        if (recipients.length != amounts.length) revert ArrayLengthMismatch();
        for (uint256 i = 0; i < recipients.length; ++i) {
            _mint(recipients[i], amounts[i]);
        }
    }
}
