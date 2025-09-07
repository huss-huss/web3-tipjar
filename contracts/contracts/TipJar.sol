// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TipJar
 * @dev A contract that allows users to send tips in ETH or ERC-20 tokens
 */
contract TipJar is Ownable, ReentrancyGuard {
    // Events
    event Tipped(address indexed tipper, uint256 amount, address token);
    event TokenTipped(address indexed tipper, uint256 amount, address indexed token);
    event Withdrawn(address indexed owner, uint256 amount, address token);

    // State variables
    mapping(address => uint256) public totalTipsByAddress;
    mapping(address => mapping(address => uint256)) public tokenTipsByAddress; // user => token => amount
    uint256 public totalTipsReceived;
    mapping(address => uint256) public totalTokenTipsReceived; // token => total amount

    // Constructor
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Allow users to tip with ETH
     */
    function tip() external payable nonReentrant {
        require(msg.value > 0, "Tip amount must be greater than 0");
        
        totalTipsByAddress[msg.sender] += msg.value;
        totalTipsReceived += msg.value;
        
        emit Tipped(msg.sender, msg.value, address(0));
    }

    /**
     * @dev Allow users to tip with ERC-20 tokens
     * @param token The address of the ERC-20 token
     * @param amount The amount of tokens to tip
     */
    function tipWithToken(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Token address cannot be zero");
        require(amount > 0, "Tip amount must be greater than 0");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        tokenTipsByAddress[msg.sender][token] += amount;
        totalTokenTipsReceived[token] += amount;
        
        emit TokenTipped(msg.sender, amount, token);
    }

    /**
     * @dev Get total tips (ETH) for a specific address
     * @param user The address to check
     * @return The total ETH tips sent by the user
     */
    function getTotalTipsByAddress(address user) external view returns (uint256) {
        return totalTipsByAddress[user];
    }

    /**
     * @dev Get total token tips for a specific address and token
     * @param user The address to check
     * @param token The token address to check
     * @return The total token tips sent by the user
     */
    function getTokenTipsByAddress(address user, address token) external view returns (uint256) {
        return tokenTipsByAddress[user][token];
    }

    /**
     * @dev Withdraw ETH (only owner)
     */
    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH withdrawal failed");
        
        emit Withdrawn(owner(), balance, address(0));
    }

    /**
     * @dev Withdraw ERC-20 tokens (only owner)
     * @param token The address of the token to withdraw
     */
    function withdrawToken(address token) external onlyOwner nonReentrant {
        require(token != address(0), "Token address cannot be zero");
        
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        require(tokenContract.transfer(owner(), balance), "Token withdrawal failed");
        
        emit Withdrawn(owner(), balance, token);
    }

    /**
     * @dev Get contract ETH balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get contract token balance
     * @param token The address of the token to check
     */
    function getTokenBalance(address token) external view returns (uint256) {
        require(token != address(0), "Token address cannot be zero");
        return IERC20(token).balanceOf(address(this));
    }
}
