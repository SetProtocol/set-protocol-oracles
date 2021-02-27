/*
    Copyright 2020 Set Labs Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

pragma solidity 0.5.7;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { AggregatorInterface } from "chainlink/v0.5/contracts/dev/AggregatorInterface.sol";


/**
 * @title ChainlinkOracleAdapterV2
 * @author Set Protocol
 *
 * Coerces outputs from Chainlink oracles to uint256 and adapts value to 18 decimals.
 */
contract ChainlinkOracleAdapterV2 {
    using SafeMath for uint256;

    /* ============ State Variables ============ */
    AggregatorInterface public oracle;
    uint256 public priceMultiplier;

    /* ============ Constructor ============ */
    /*
     * Set address of aggregator being adapted for use. Different oracles return prices with different decimals.
     * In this iteration of ChainLinkOracleAdapter, we allow the deployer to specify the multiple decimal
     * to pass into the contract
     *
     * DPI (18): https://etherscan.io/address/0xD2A593BF7594aCE1faD597adb697b5645d5edDB2
     * DAI (8): https://etherscan.io/address/0xaed0c38402a5d19df6e4c03f4e2dced6e29c1ee9
     *
     * @param  _oracle                  The address of medianizer being adapted from bytes to uint256
     * @param  _priceMultiplierDecimals Decimal places to convert 
     */
    constructor(
        AggregatorInterface _oracle,
        uint256 _priceMultiplierDecimals
    )
        public
    {
        oracle = _oracle;
        priceMultiplier = 10 ** _priceMultiplierDecimals;
    }

    /* ============ External ============ */

    /*
     * Reads value of oracle and coerces return to uint256 then applies price multiplier
     *
     * @returns         Chainlink oracle price in uint256
     */
    function read()
        external
        view
        returns (uint256)
    {
        // Read value of medianizer and coerce to uint256
        uint256 oracleOutput = uint256(oracle.latestAnswer());

        // Apply multiplier to create 18 decimal price (since Chainlink returns 8 decimals)
        return oracleOutput.mul(priceMultiplier);
    }
}