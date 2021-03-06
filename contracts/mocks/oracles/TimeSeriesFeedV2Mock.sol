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
pragma experimental "ABIEncoderV2";

import { TimeSeriesFeedV2 } from "../../meta-oracles/lib/TimeSeriesFeedV2.sol";

/**
 * @title TimeSeriesFeedV2Mock
 * @author Set Protocol
 *
 * Mock contract for interacting with TimeSeriesFeedV2
 */
contract TimeSeriesFeedV2Mock is
    TimeSeriesFeedV2
{
    string public dummyState;

    constructor(
        uint256 _updateInterval,
        uint256 _nextEarliestUpdate,
        uint256 _maxDataPoints,
        uint256[] memory _seededValues
    )
        public
        TimeSeriesFeedV2(
            _updateInterval,
            _nextEarliestUpdate,
            _maxDataPoints,
            _seededValues
        )
    {}

    function calculateNextValue()
        internal
        returns (uint256)
    {
        return 1;
    }
}