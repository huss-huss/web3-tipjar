// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {TipJar} from "../TipJar.sol";

/// @dev Test-only. Becomes the TipJar owner and tries to re-enter withdrawETH
///      from its receive() hook. Records whether the re-entry was blocked.
contract ReentrantOwner {
    TipJar public immutable jar;
    bool public reentryAttempted;
    bool public reentrySucceeded;
    bytes public reentryRevertData;

    constructor(TipJar jar_) {
        jar = jar_;
    }

    function acceptOwnership() external {
        jar.acceptOwnership();
    }

    function attack(uint256 amount) external {
        jar.withdrawETH(payable(address(this)), amount);
    }

    receive() external payable {
        if (reentryAttempted) return;
        reentryAttempted = true;
        try jar.withdrawETH(payable(address(this)), msg.value) {
            reentrySucceeded = true;
        } catch (bytes memory reason) {
            reentryRevertData = reason;
        }
    }
}
