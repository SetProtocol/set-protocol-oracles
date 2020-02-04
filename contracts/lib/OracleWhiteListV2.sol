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


import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import { OracleWhiteList } from "set-protocol-contracts/contracts/lib/OracleWhiteList.sol";

import { IOracle } from "../meta-oracles/interfaces/IOracle.sol";


/**
 * @title OracleWhiteListV2
 * @author Set Protocol
 *
 * WhiteList that matches whitelisted tokens to their on chain price oracle
 */
contract OracleWhiteListV2 is
    OracleWhiteList
{

    /* ============ Constructor ============ */

    /**
     * Constructor function for OracleWhiteListV2
     *
     * Allow initial addresses to be passed in so a separate transaction is not required for each.
     * Each token address passed is matched with a corresponding oracle address at the same index.
     * The _initialTokenAddresses and _initialOracleAddresses arrays must be equal length.
     *
     * @param _initialTokenAddresses        Starting set of toke addresses to whitelist
     * @param _initialOracleAddresses       Starting set of oracle addresses to whitelist
     */
    constructor(
        address[] memory _initialTokenAddresses,
        address[] memory _initialOracleAddresses
    )
        public
        OracleWhiteList(
            _initialTokenAddresses,
            _initialOracleAddresses
        )
    {}

    /* ============ External Functions ============ */

    /**
     * Return array of oracle values based on passed in token addresses 
     *
     * @param  _tokenAddresses    Array of token addresses to get oracle addresses for
     * @return uint256[]          Array of oracle values
     */
    function getOracleValuesByToken(
        address[] calldata _tokenAddresses
    )
        external
        view
        returns (uint256[] memory)
    {
        // Get length of passed array
        uint256 arrayLength = _tokenAddresses.length;

        // Check that passed array length is greater than 0
        require(
            arrayLength > 0,
            "OracleWhiteList.getOracleAddressesByToken: Array length must be greater than 0."
        );

        // Instantiate oracle addresses array
        uint256[] memory oracleValues = new uint256[](arrayLength);

        for (uint256 i = 0; i < arrayLength; i++) {
            // Get oracle address for token address at index i
            address oracleAddress = OracleWhiteList.getOracleAddressByToken(
                _tokenAddresses[i]
            );

            oracleValues[i] = IOracle(oracleAddress).read();
        }

        return oracleValues;       
    }

}