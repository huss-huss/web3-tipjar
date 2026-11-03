// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @dev Test-only. Minimal non-standard token whose transfer/transferFrom
///      return nothing (like USDT on mainnet). Calling it through a plain
///      IERC20 interface that expects a bool would revert.
contract NoReturnToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor() {
        balanceOf[msg.sender] = 1_000_000 ether;
    }

    function approve(address spender, uint256 value) external {
        allowance[msg.sender][spender] = value;
    }

    function transfer(address to, uint256 value) external {
        require(balanceOf[msg.sender] >= value, "balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
    }

    function transferFrom(address from, address to, uint256 value) external {
        require(balanceOf[from] >= value, "balance");
        require(allowance[from][msg.sender] >= value, "allowance");
        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
    }
}
