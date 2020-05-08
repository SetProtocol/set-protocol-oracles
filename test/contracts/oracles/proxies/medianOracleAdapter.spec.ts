require('module-alias/register');

import * as _ from 'lodash';
import * as chai from 'chai';

import { Address, Blockchain } from 'set-protocol-utils';
import { BigNumber } from 'bignumber.js';

import ChaiSetup from '@utils/chaiSetup';
import { BigNumberSetup } from '@utils/bigNumberSetup';
import { ether } from '@utils/units';

import {
  UpdatableOracleMockContract,
  MedianOracleAdapterCallerContract,
  MedianOracleAdapterContract,
} from '@utils/contracts';
import { DEFAULT_GAS } from '@utils/constants';
import { expectRevertError } from '@utils/tokenAssertions';

import { getWeb3 } from '@utils/web3Helper';

import { OracleHelper } from '@utils/helpers/oracleHelper';

BigNumberSetup.configure();
ChaiSetup.configure();
const web3 = getWeb3();
const { expect } = chai;
const blockchain = new Blockchain(web3);

contract('MedianOracleAdapter', accounts => {
  const [
    deployerAccount,
    newOracleAccount,
    unAuthorizedAccount,
  ] = accounts;

  let oracleMock: UpdatableOracleMockContract;
  let oracleProxy: MedianOracleAdapterContract;
  let oracleCaller: MedianOracleAdapterCallerContract;

  let initialPrice: BigNumber;

  const oracleHelper = new OracleHelper(deployerAccount);

  beforeEach(async () => {
    blockchain.saveSnapshotAsync();

    initialPrice = ether(2);

    oracleMock = await oracleHelper.deployUpdatableOracleMockAsync(initialPrice);

    // Deploy LegacyMakerdao oracle proxy
    oracleProxy = await oracleHelper.deployMedianOracleAdapterAsync(oracleMock.address);

    oracleCaller = await oracleHelper.deployMedianOracleAdapterCallerAsync(oracleProxy.address);
  });

  afterEach(async () => {
    blockchain.revertAsync();
  });

  describe('#constructor', async () => {
    let subjectOracleAddress: Address;

    beforeEach(async () => {
      subjectOracleAddress = oracleMock.address;
    });

    async function subject(): Promise<MedianOracleAdapterContract> {
      return oracleHelper.deployMedianOracleAdapterAsync(
        subjectOracleAddress,
      );
    }

    it('sets the correct oracleInstance', async () => {
      oracleProxy = await subject();

      const actualOracleAddress = await oracleProxy.oracleInstance.callAsync();

      expect(actualOracleAddress).to.be.bignumber.equal(subjectOracleAddress);
    });
  });

  describe('#read', async () => {
    beforeEach(async () => {
      await oracleProxy.addAuthorizedAddress.sendTransactionAsync(
        oracleCaller.address,
        { from: deployerAccount, gas: DEFAULT_GAS },
      );
    });

    async function subject(): Promise<string> {
      return oracleCaller.read.callAsync();
    }

    it('returns the correct price', async () => {
      const retrieved = await subject();

      const convertedResult = web3.utils.hexToNumberString(retrieved);

      expect(convertedResult).to.be.bignumber.equal(initialPrice);
    });

    describe('when unauthorized address is caller', async () => {
      beforeEach(async () => {
        await oracleProxy.removeAuthorizedAddress.sendTransactionAsync(
          oracleCaller.address,
          { from: deployerAccount, gas: DEFAULT_GAS },
        );
      });

      it('should revert', async () => {
        await expectRevertError(subject());
      });
    });
  });

  describe('#changeOracleAddress', async () => {
    let subjectNewOracleAddress: Address;
    let subjectCaller: Address;

    beforeEach(async () => {
      subjectNewOracleAddress = newOracleAccount;
      subjectCaller = deployerAccount;
    });

    async function subject(): Promise<string> {
      return oracleProxy.changeOracleAddress.sendTransactionAsync(
        subjectNewOracleAddress,
        { from: subjectCaller },
      );
    }

    it('returns the correct new oracle address', async () => {
      await subject();

      const actualOracleAddress = await oracleProxy.oracleInstance.callAsync();

      expect(actualOracleAddress).to.be.bignumber.equal(subjectNewOracleAddress);
    });

    describe('when unauthorized address is caller', async () => {
      beforeEach(async () => {
        subjectCaller = unAuthorizedAccount;
      });

      it('should revert', async () => {
        await expectRevertError(subject());
      });
    });

    describe('when same address passed in', async () => {
      beforeEach(async () => {
        subjectNewOracleAddress = oracleMock.address;
      });

      it('should revert', async () => {
        await expectRevertError(subject());
      });
    });
  });
});
