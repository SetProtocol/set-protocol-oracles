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

/**
 * @title IHistoricalPriceFeed
 * @author Set Protocol
 *
 * Interface for interacting with HistoricalPriceFeed contract
 */
interface IHistoricalPriceFeed {

    /*
     * Query linked list for specified days of data. Will revert if number of days
     * passed exceeds amount of days collected.
     *
     * @param  _dataDays            Number of dats of data being queried
     */
    function read(
        uint256 _dataDays
    )
        external
        view
        returns (uint256[] memory);

    /*
     * Get the source medianizer address for Price Feed.
     */
    function medianizerInstance()
        external
        view
        returns (address);
}