/*
    Copyright 2019 Set Labs Inc.

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

import { Authorizable } from "../../external/SetProtocolContracts/lib/Authorizable.sol";

import { IOracle } from "../interfaces/IOracle.sol";


/**
 * @title LegacyMakerOracleProxy
 * @author Set Protocol
 *
 * Permissioned oracle proxy that is intended to replicate the interface of the MakerDAO Legacy IMedian
 * oracle that returns bytes32 values.
 */
contract LegacyMakerOracleProxy is
    Authorizable
{

    /* ============ State Variables ============ */
    IOracle public oracleInstance;

    /* ============ Events ============ */

    event LogOracleUpdated(
        address indexed newOracleAddress
    );

    /* ============ Constructor ============ */
    /*
     * Set address of oracle being proxied
     *
     * @param  _oracleAddress    The address of oracle being proxied
     */
    constructor(
        IOracle _oracleAddress
    )
        public
    {
        oracleInstance = _oracleAddress;
    }

    /* ============ External ============ */

    /*
     * Reads value of external oracle and passed to Set system. Only authorized addresses are allowed
     * to call read().
     *
     * @returns         Oracle's uint256 output
     */
    function read()
        external
        view
        onlyAuthorized
        returns (bytes32)
    {
        // Read value of oracle and coerces into bytes32
        return bytes32(oracleInstance.read());
    }

    /*
     * Sets address of new oracle to be proxied. Only owner has ability to update oracleAddress.
     *
     * @param _newOracleAddress         Address of new oracle being proxied
     */
    function changeOracleAddress(
        IOracle _newOracleAddress
    )
        external
        onlyOwner
        timeLockUpgrade // Must be placed after onlyOwner
    {
        // Check to make sure new oracle address is passed
        require(
            address(_newOracleAddress) != address(oracleInstance),
            "LegacyMakerOracleProxy.changeOracleAddress: Must give new oracle address."
        );

        // Set new Oracle instance
        oracleInstance = _newOracleAddress;

        emit LogOracleUpdated(address(_newOracleAddress));
    }
}
