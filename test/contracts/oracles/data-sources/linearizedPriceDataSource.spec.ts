require('module-alias/register');

import * as _ from 'lodash';
import * as ABIDecoder from 'abi-decoder';
import * as chai from 'chai';
import * as setProtocolUtils from 'set-protocol-utils';

import { Address, TimeSeriesFeedState } from 'set-protocol-utils';
import { BigNumber } from 'bignumber.js';

import ChaiSetup from '@utils/chaiSetup';
import { BigNumberSetup } from '@utils/bigNumberSetup';
import { Blockchain } from '@utils/blockchain';
import { ether } from '@utils/units';
import { MedianContract } from 'set-protocol-contracts';
import {
  LegacyMakerOracleAdapterContract,
  LinearizedPriceDataSourceContract,
  OracleProxyContract,
} from '@utils/contracts';
import {
  DEFAULT_GAS,
  ONE_DAY_IN_SECONDS,
  ZERO
} from '@utils/constants';
import { expectRevertError } from '@utils/tokenAssertions';
import { getWeb3 } from '@utils/web3Helper';
import { LogOracleUpdated } from '@utils/contract_logs/linearizedPriceDataSource';

import { OracleHelper } from '@utils/helpers/oracleHelper';

BigNumberSetup.configure();
ChaiSetup.configure();
const web3 = getWeb3();
const LinearizedPriceDataSource = artifacts.require('LinearizedPriceDataSource');
const { expect } = chai;
const blockchain = new Blockchain(web3);
const { SetProtocolTestUtils: SetTestUtils } = setProtocolUtils;
const setTestUtils = new SetTestUtils(web3);

contract('LinearizedPriceDataSource', accounts => {
  const [
    deployerAccount,
    oracleAccount,
    nonOwnerAccount,
  ] = accounts;

  let ethMedianizer: MedianContract;
  let legacyMakerOracleAdapter: LegacyMakerOracleAdapterContract;
  let linearizedDataSource: LinearizedPriceDataSourceContract;
  let oracleProxy: OracleProxyContract;

  const oracleHelper = new OracleHelper(deployerAccount);

  before(async () => {
    ABIDecoder.addABI(LinearizedPriceDataSource.abi);
  });

  after(async () => {
    ABIDecoder.removeABI(LinearizedPriceDataSource.abi);
  });

  beforeEach(async () => {
    blockchain.saveSnapshotAsync();

    ethMedianizer = await oracleHelper.deployMedianizerAsync();
    await oracleHelper.addPriceFeedOwnerToMedianizer(ethMedianizer, deployerAccount);

    legacyMakerOracleAdapter = await oracleHelper.deployLegacyMakerOracleAdapterAsync(
      ethMedianizer.address,
    );

    oracleProxy = await oracleHelper.deployOracleProxyAsync(
      legacyMakerOracleAdapter.address,
    );
  });

  afterEach(async () => {
    blockchain.revertAsync();
  });

  describe('#constructor', async () => {
    let subjectInterpolationThreshold: BigNumber;
    let subjectOracleAddress: Address;
    let subjectDataDescription: string;

    beforeEach(async () => {
      subjectInterpolationThreshold = ONE_DAY_IN_SECONDS;
      subjectOracleAddress = oracleProxy.address;
      subjectDataDescription = '200DailyETHPrice';
    });

    async function subject(): Promise<LinearizedPriceDataSourceContract> {
      return oracleHelper.deployLinearizedPriceDataSourceAsync(
        subjectOracleAddress,
        subjectInterpolationThreshold,
        subjectDataDescription,
      );
    }

    it('sets the correct interpolationThreshold', async () => {
      linearizedDataSource = await subject();

      const actualInterpolationThreshold = await linearizedDataSource.interpolationThreshold.callAsync();

      expect(actualInterpolationThreshold).to.be.bignumber.equal(subjectInterpolationThreshold);
    });

    it('sets the correct oracle address', async () => {
      linearizedDataSource = await subject();

      const actualOracleAddress = await linearizedDataSource.oracleInstance.callAsync();

      expect(actualOracleAddress).to.equal(subjectOracleAddress);
    });

    it('sets the correct data description', async () => {
      linearizedDataSource = await subject();

      const actualDataDescription = await linearizedDataSource.dataDescription.callAsync();

      expect(actualDataDescription).to.equal(subjectDataDescription);
    });
  });

  describe('#read', async () => {
    let newEthPrice: BigNumber;
    let interpolationThreshold: BigNumber;

    let subjectTimeSeriesState: TimeSeriesFeedState;
    let subjectTimeFastForward: BigNumber;

    let customEtherPrice: BigNumber;

    beforeEach(async () => {
      newEthPrice = customEtherPrice || ether(200);
      await oracleHelper.updateMedianizerPriceAsync(
        ethMedianizer,
        newEthPrice,
        SetTestUtils.generateTimestamp(1000)
      );

      interpolationThreshold = ONE_DAY_IN_SECONDS;
      const oracleAddress = oracleProxy.address;
      linearizedDataSource = await oracleHelper.deployLinearizedPriceDataSourceAsync(
        oracleAddress,
        interpolationThreshold,
      );
      const block = await web3.eth.getBlock('latest');

      await oracleHelper.addAuthorizedAddressesToOracleProxy(
        oracleProxy,
        [linearizedDataSource.address]
      );

      const nextEarliestUpdate = new BigNumber(block.timestamp);
      const updateInterval = ONE_DAY_IN_SECONDS;

      subjectTimeSeriesState = {
        nextEarliestUpdate,
        updateInterval,
        timeSeriesData: {
          dataSizeLimit: new BigNumber(5),
          lastUpdatedIndex: new BigNumber(0),
          dataArray: [ether(100)],
        },
      } as TimeSeriesFeedState;

      subjectTimeFastForward = ZERO;
    });

    async function subject(): Promise<BigNumber> {
      await blockchain.increaseTimeAsync(subjectTimeFastForward);

      // Send dummy transaction to advance block
      await web3.eth.sendTransaction({
        from: deployerAccount,
        to: deployerAccount,
        value: ether(1).toString(),
        gas: DEFAULT_GAS,
      });

      return linearizedDataSource.read.callAsync(
        subjectTimeSeriesState
      );
    }

    it('updates the linearizedDataSource with the correct price', async () => {
      const actualPrice = await subject();

      const expectedPrice = newEthPrice;

      expect(actualPrice).to.bignumber.equal(expectedPrice);
    });

    describe('when the timestamp has surpassed the interpolationThreshold and price increases', async () => {
      beforeEach(async () => {
        subjectTimeFastForward = interpolationThreshold.mul(3);
      });

      it('returns with the correct interpolated value', async () => {
        const actualNewPrice = await subject();

        const block = await web3.eth.getBlock('latest');
        const timeFromExpectedUpdate = new BigNumber(block.timestamp).sub(subjectTimeSeriesState.nextEarliestUpdate);

        const timeFromLastUpdate = timeFromExpectedUpdate.add(subjectTimeSeriesState.updateInterval);
        const previousLoggedPrice = subjectTimeSeriesState.timeSeriesData.dataArray[0];
        const expectedNewPrice = newEthPrice
                                     .mul(subjectTimeSeriesState.updateInterval)
                                     .add(previousLoggedPrice.mul(timeFromExpectedUpdate))
                                     .div(timeFromLastUpdate)
                                     .round(0, 3);

        expect(actualNewPrice).to.bignumber.equal(expectedNewPrice);
      });
    });

    describe('when the timestamp has surpassed the interpolationThreshold and price decreases', async () => {
      before(async () => {
        customEtherPrice = new BigNumber(50);
      });

      after(async () => {
        customEtherPrice = undefined;
      });

      beforeEach(async () => {
        subjectTimeFastForward = interpolationThreshold.mul(3);
      });

      it('returns with the correct interpolated value', async () => {
        const actualNewPrice = await subject();

        const block = await web3.eth.getBlock('latest');
        const timeFromExpectedUpdate = new BigNumber(block.timestamp).sub(subjectTimeSeriesState.nextEarliestUpdate);

        const timeFromLastUpdate = timeFromExpectedUpdate.add(subjectTimeSeriesState.updateInterval);
        const previousLoggedPrice = subjectTimeSeriesState.timeSeriesData.dataArray[0];
        const expectedNewPrice = newEthPrice
                                     .mul(subjectTimeSeriesState.updateInterval)
                                     .add(previousLoggedPrice.mul(timeFromExpectedUpdate))
                                     .div(timeFromLastUpdate)
                                     .round(0, 3);

        expect(actualNewPrice).to.bignumber.equal(expectedNewPrice);
      });
    });
    describe('when the nextEarliestUpdate timestamp is greater than current block timestamp', async () => {
      beforeEach(async () => {
        const block = await web3.eth.getBlock('latest');
        subjectTimeSeriesState.nextEarliestUpdate = new BigNumber(block.timestamp).add(60);
      });

      it('should revert', async () => {
        await expectRevertError(subject());
      });
    });
  });

  describe('#changeOracle', async () => {
    let ethPrice: BigNumber;

    let subjectNewOracle: Address;
    let subjectCaller: Address;

    beforeEach(async () => {
      ethPrice = ether(150);
      await oracleHelper.updateMedianizerPriceAsync(
        ethMedianizer,
        ethPrice,
        SetTestUtils.generateTimestamp(1000),
      );

      const oracleAddress = oracleProxy.address;
      linearizedDataSource = await oracleHelper.deployLinearizedPriceDataSourceAsync(
        oracleAddress,
      );

      subjectNewOracle = oracleAccount;
      subjectCaller = deployerAccount;
    });

    async function subject(): Promise<string> {
      return linearizedDataSource.changeOracle.sendTransactionAsync(
        subjectNewOracle,
        {
          from: subjectCaller,
          gas: DEFAULT_GAS,
        }
      );
    }

    it('updates the Oracle address', async () => {
      await subject();

      const actualOracleAddress = await linearizedDataSource.oracleInstance.callAsync();

      expect(actualOracleAddress).to.equal(subjectNewOracle);
    });

    it('emits correct LogOracleUpdated event', async () => {
      const txHash = await subject();

      const formattedLogs = await setTestUtils.getLogsFromTxHash(txHash);
      const expectedLogs = LogOracleUpdated(
        subjectNewOracle,
        linearizedDataSource.address
      );

      await SetTestUtils.assertLogEquivalence(formattedLogs, expectedLogs);
    });

    describe('when non owner calls', async () => {
      beforeEach(async () => {
        subjectCaller = nonOwnerAccount;
      });

      it('should revert', async () => {
        await expectRevertError(subject());
      });
    });

    describe('when passed address is not new', async () => {
      beforeEach(async () => {
        subjectNewOracle = oracleProxy.address;
      });

      it('should revert', async () => {
        await expectRevertError(subject());
      });
    });
  });
});