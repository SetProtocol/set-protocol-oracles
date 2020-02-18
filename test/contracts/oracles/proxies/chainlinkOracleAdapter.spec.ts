require('module-alias/register');

import * as _ from 'lodash';
import * as chai from 'chai';

import { Address } from 'set-protocol-utils';
import { BigNumber } from 'bignumber.js';
import { ether } from '@utils/units';

import ChaiSetup from '@utils/chaiSetup';
import { BigNumberSetup } from '@utils/bigNumberSetup';
import { Blockchain } from '@utils/blockchain';

import {
  ChainlinkAggregatorMockContract,
  ChainlinkOracleAdapterContract,
} from '@utils/contracts';

import { getWeb3 } from '@utils/web3Helper';

import { OracleHelper } from '@utils/helpers/oracleHelper';

BigNumberSetup.configure();
ChaiSetup.configure();
const web3 = getWeb3();
const { expect } = chai;
const blockchain = new Blockchain(web3);

contract('chainlinkOracleAdapter', accounts => {
  const [
    deployerAccount,
  ] = accounts;

  let customDollarValue: number;
  let customOracleValue: BigNumber;
  let chainlinkAggregatorMock: ChainlinkAggregatorMockContract;

  let chainlinkOracleAdapter: ChainlinkOracleAdapterContract;


  const oracleHelper = new OracleHelper(deployerAccount);

  beforeEach(async () => {
    blockchain.saveSnapshotAsync();

    customDollarValue = 100;
    // Equal to 100 since Chainlink numbers are 8 decimal
    customOracleValue = new BigNumber(10 ** 8).mul(customDollarValue);
    chainlinkAggregatorMock = await oracleHelper.deployChainlinkAggregatorMockAsync(
      customOracleValue
    );
  });

  afterEach(async () => {
    blockchain.revertAsync();
  });

  describe.only('#constructor', async () => {
    let subjectChainlinkOracleAddress: Address;

    beforeEach(async () => {
      subjectChainlinkOracleAddress = chainlinkAggregatorMock.address;
    });

    async function subject(): Promise<ChainlinkOracleAdapterContract> {
      return oracleHelper.deployChainlinkOracleAdapterAsync(
        subjectChainlinkOracleAddress,
      );
    }

    it('sets the correct Chainlink Oracle Address', async () => {
      chainlinkOracleAdapter = await subject();

      const actualChainlinkOracleAddress = await chainlinkOracleAdapter.oracle.callAsync();

      expect(actualChainlinkOracleAddress).to.be.bignumber.equal(subjectChainlinkOracleAddress);
    });
  });

  describe.only('#read', async () => {
    beforeEach(async () => {
      chainlinkOracleAdapter = await oracleHelper.deployChainlinkOracleAdapterAsync(
        chainlinkAggregatorMock.address,
      );
    });

    async function subject(): Promise<BigNumber> {
      return chainlinkOracleAdapter.read.callAsync();
    }

    it('returns the correct price in uint256', async () => {
      const actualTokenPrice = await subject();
      expect(actualTokenPrice).to.be.bignumber.equal(ether(customDollarValue));
    });
  });
});