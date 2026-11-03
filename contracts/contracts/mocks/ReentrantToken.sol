// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {TipJar} from "../TipJar.sol";

/// @dev Test-only. A malicious ERC-20 whose transferFrom re-enters
///      TipJar.tipWithToken. Records whether the re-entry was blocked.
contract ReentrantToken is ERC20 {
    TipJar public immutable jar;
    bool public reentryAttempted;
    bool public reentrySucceeded;
    bytes public reentryRevertData;

    constructor(TipJar jar_) ERC20("Reentrant", "RE") {
        jar = jar_;
        _mint(msg.sender, 1_000_000 ether);
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        if (!reentryAttempted) {
            reentryAttempted = true;
            try jar.tipWithToken(address(this), value) {
                reentrySucceeded = true;
            } catch (bytes memory reason) {
                reentryRevertData = reason;
            }
        }
        return super.transferFrom(from, to, value);
    }
}
