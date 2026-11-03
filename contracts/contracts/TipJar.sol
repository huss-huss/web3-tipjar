// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TipJar
 * @notice Accepts tips in ETH or ERC-20 tokens and lets the owner withdraw them.
 * @dev Learning project. Not audited. See SECURITY.md for what was checked.
 *
 * Design notes:
 * - Withdrawals are pull-based: funds stay in the contract until the owner
 *   explicitly withdraws them to a recipient of their choice.
 * - Ownership uses a two-step transfer and cannot be renounced, so funds can
 *   never be locked in a contract with no owner.
 * - Token tips record the amount actually received (balance delta), so
 *   fee-on-transfer tokens cannot inflate the accounting.
 * - Plain ETH transfers without calling tip() are rejected.
 */
contract TipJar is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAmount();
    error ZeroAddress();
    error InsufficientBalance(uint256 requested, uint256 available);
    error EthTransferFailed();
    error RenounceOwnershipDisabled();
    error DirectEthNotAccepted();

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event Tipped(address indexed tipper, uint256 amount);
    event TokenTipped(address indexed tipper, address indexed token, uint256 amount);
    event EthWithdrawn(address indexed to, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    /// @notice Total ETH (wei) tipped by each address.
    mapping(address tipper => uint256 amount) public totalTipsByAddress;

    /// @notice Total amount of `token` tipped by each address.
    mapping(address tipper => mapping(address token => uint256 amount)) public tokenTipsByAddress;

    /// @notice Total ETH (wei) ever tipped. Not reduced by withdrawals.
    uint256 public totalTipsReceived;

    /// @notice Total amount of each token ever tipped. Not reduced by withdrawals.
    mapping(address token => uint256 amount) public totalTokenTipsReceived;

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ---------------------------------------------------------------------
    // Tipping
    // ---------------------------------------------------------------------

    /// @notice Tip the jar with ETH.
    function tip() external payable {
        if (msg.value == 0) revert ZeroAmount();

        totalTipsByAddress[msg.sender] += msg.value;
        totalTipsReceived += msg.value;

        emit Tipped(msg.sender, msg.value);
    }

    /**
     * @notice Tip the jar with an ERC-20 token. Requires a prior `approve`.
     * @param token ERC-20 token address.
     * @param amount Amount to transfer from the caller.
     */
    function tipWithToken(address token, uint256 amount) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        IERC20 erc20 = IERC20(token);
        uint256 balanceBefore = erc20.balanceOf(address(this));
        erc20.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = erc20.balanceOf(address(this)) - balanceBefore;
        if (received == 0) revert ZeroAmount();

        tokenTipsByAddress[msg.sender][token] += received;
        totalTokenTipsReceived[token] += received;

        emit TokenTipped(msg.sender, token, received);
    }

    // ---------------------------------------------------------------------
    // Withdrawals (owner only)
    // ---------------------------------------------------------------------

    /**
     * @notice Withdraw ETH from the jar.
     * @param to Recipient of the ETH.
     * @param amount Amount in wei.
     */
    function withdrawETH(address payable to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        uint256 available = address(this).balance;
        if (amount > available) revert InsufficientBalance(amount, available);

        emit EthWithdrawn(to, amount);

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert EthTransferFailed();
    }

    /**
     * @notice Withdraw ERC-20 tokens from the jar.
     * @param token ERC-20 token address.
     * @param to Recipient of the tokens.
     * @param amount Amount to withdraw.
     */
    function withdrawToken(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        uint256 available = IERC20(token).balanceOf(address(this));
        if (amount > available) revert InsufficientBalance(amount, available);

        emit TokenWithdrawn(token, to, amount);

        IERC20(token).safeTransfer(to, amount);
    }

    // ---------------------------------------------------------------------
    // Ownership
    // ---------------------------------------------------------------------

    /// @dev Renouncing would lock all funds forever, so it is disabled.
    function renounceOwnership() public view override onlyOwner {
        revert RenounceOwnershipDisabled();
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getTotalTipsByAddress(address user) external view returns (uint256) {
        return totalTipsByAddress[user];
    }

    function getTokenTipsByAddress(address user, address token) external view returns (uint256) {
        return tokenTipsByAddress[user][token];
    }

    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getTokenBalance(address token) external view returns (uint256) {
        if (token == address(0)) revert ZeroAddress();
        return IERC20(token).balanceOf(address(this));
    }

    // ---------------------------------------------------------------------
    // Fallbacks
    // ---------------------------------------------------------------------

    /// @dev Reject plain ETH so every deposit goes through tip() and is accounted.
    receive() external payable {
        revert DirectEthNotAccepted();
    }
}
