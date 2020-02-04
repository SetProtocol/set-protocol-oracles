require('module-alias/register');

import * as _ from 'lodash';
import * as chai from 'chai';
import * as setProtocolUtils from 'set-protocol-utils';

import { Address } from 'set-protocol-utils';
import { BigNumber } from 'bignumber.js';

import ChaiSetup from '@utils/chaiSetup';
import { BigNumberSetup } from '@utils/bigNumberSetup';
import { Blockchain } from '@utils/blockchain';
import { ether } from '@utils/units';
import { MedianContract } from 'set-protocol-contracts';
import {
  HistoricalPriceFeedContract,
  MovingAverageOracleContract,
} from '@utils/contracts';
import { ZERO, ONE_DAY_IN_SECONDS } from '@utils/constants';
import { getWeb3 } from '@utils/web3Helper';

import { OracleHelper } from '@utils/helpers/oracleHelper';

BigNumberSetup.configure();
ChaiSetup.configure();
const web3 = getWeb3();
const { expect } = chai;
const blockchain = new Blockchain(web3);
const { SetProtocolTestUtils: SetTestUtils } = setProtocolUtils;

contract('MovingAverageOracle', accounts => {
  const [
    deployerAccount,
  ] = accounts;

  let ethMedianizer: MedianContract;
  let historicalPriceFeed: HistoricalPriceFeedContract;
  let movingAverageOracle: MovingAverageOracleContract;

  let initialEthPrice: BigNumber;

  const oracleHelper = new OracleHelper(deployerAccount);


  beforeEach(async () => {
    blockchain.saveSnapshotAsync();

    ethMedianizer = await oracleHelper.deployMedianizerAsync();
    await oracleHelper.addPriceFeedOwnerToMedianizer(ethMedianizer, deployerAccount);

    initialEthPrice = ether(150);
    await oracleHelper.updateMedianizerPriceAsync(
      ethMedianizer,
      initialEthPrice,
      SetTestUtils.generateTimestamp(1000),
    );
  });

  afterEach(async () => {
    blockchain.revertAsync();
  });

  describe('#constructor', async () => {
    let seededValues: BigNumber[];

    let subjectPriceFeedAddress: Address;
    let subjectDataDescription: string;

    beforeEach(async () => {
      const updateFrequency = ONE_DAY_IN_SECONDS;
      const feedDataDescription = '200DailyETHPrice';
      seededValues = [];
      historicalPriceFeed = await oracleHelper.deployHistoricalPriceFeedAsync(
        updateFrequency,
        ethMedianizer.address,
        feedDataDescription,
        seededValues,
      );

      subjectPriceFeedAddress = historicalPriceFeed.address;
      subjectDataDescription = 'ETHDailyMA';
    });

    async function subject(): Promise<MovingAverageOracleContract> {
      return oracleHelper.deployMovingAverageOracleAsync(
        subjectPriceFeedAddress,
        subjectDataDescription
      );
    }

    it('sets the correct price feed address', async () => {
      movingAverageOracle = await subject();

      const actualPriceFeedAddress = await movingAverageOracle.priceFeedInstance.callAsync();

      expect(actualPriceFeedAddress).to.equal(subjectPriceFeedAddress);
    });

    it('sets the correct data description', async () => {
      movingAverageOracle = await subject();

      const actualDataDescription = await movingAverageOracle.dataDescription.callAsync();

      expect(actualDataDescription).to.equal(subjectDataDescription);
    });
  });

  describe('#read', async () => {
    let updatedValues: BigNumber[];

    let subjectDataPoints: BigNumber;

    beforeEach(async () => {
      const updateFrequency = ONE_DAY_IN_SECONDS;
      const feedDataDescription = '200DailyETHPrice';
      const seededValues = [];
      historicalPriceFeed = await oracleHelper.deployHistoricalPriceFeedAsync(
        updateFrequency,
        ethMedianizer.address,
        feedDataDescription,
        seededValues,
      );

      updatedValues = await oracleHelper.batchUpdateHistoricalPriceFeedAsync(
        historicalPriceFeed,
        ethMedianizer,
        19
      );

      const dataDescription = 'ETH20dayMA';
      movingAverageOracle = await oracleHelper.deployMovingAverageOracleAsync(
        historicalPriceFeed.address,
        dataDescription
      );

      subjectDataPoints = new BigNumber(20);
    });

    async function subject(): Promise<string> {
      return movingAverageOracle.read.callAsync(
        subjectDataPoints
      );
    }

    it('returns the correct moving average', async () => {
      const actualMovingAverage = await subject();

      updatedValues.push(initialEthPrice);
      const expectedMovingAverage = updatedValues.reduce((a, b) => a.add(b), ZERO).div(updatedValues.length);

      expect(actualMovingAverage).to.be.bignumber.equal(expectedMovingAverage);
    });
  });

  describe('#getSourceMedianizer', async () => {

    beforeEach(async () => {
      const updateFrequency = ONE_DAY_IN_SECONDS;
      const feedDataDescription = '200DailyETHPrice';
      const seededValues = [];
      historicalPriceFeed = await oracleHelper.deployHistoricalPriceFeedAsync(
        updateFrequency,
        ethMedianizer.address,
        feedDataDescription,
        seededValues,
      );

      const dataDescription = 'ETH20dayMA';
      movingAverageOracle = await oracleHelper.deployMovingAverageOracleAsync(
        historicalPriceFeed.address,
        dataDescription
      );
    });

    async function subject(): Promise<string> {
      return movingAverageOracle.getSourceMedianizer.callAsync();
    }

    it('returns the correct source medianizer address', async () => {
      const actualSourceMedianizer = await subject();

      expect(actualSourceMedianizer).to.be.bignumber.equal(ethMedianizer.address);
    });
  });
});