require('module-alias/register');

import * as ABIDecoder from 'abi-decoder';
import * as chai from 'chai';
import { BigNumber } from 'bignumber.js';
import * as setProtocolUtils from 'set-protocol-utils';
import { Address, Log } from 'set-protocol-utils';

import ChaiSetup from '@utils/chaiSetup';
import { BigNumberSetup } from '@utils/bigNumberSetup';
import { TokenOraclePairAdded, TokenOraclePairRemoved } from '@utils/contract_logs/oracleWhiteList';
import { ConstantPriceOracleContract, OracleWhiteListV2Contract } from '@utils/contracts';
import {
  NULL_ADDRESS
} from '@utils/constants';
import { expectRevertError } from '@utils/tokenAssertions';
import { Blockchain } from '@utils/blockchain';
import { getWeb3 } from '@utils/web3Helper';

import { OracleHelper } from '@utils/helpers/oracleHelper';

BigNumberSetup.configure();
ChaiSetup.configure();
const web3 = getWeb3();
const { SetProtocolTestUtils: SetTestUtils } = setProtocolUtils;
const OracleWhiteListV2 = artifacts.require('OracleWhiteListV2');
const { expect } = chai;
const setTestUtils = new SetTestUtils(web3);
const blockchain = new Blockchain(web3);

contract('OracleWhiteListV2', accounts => {
  const [
    ownerAccount,
    notOwnerAccount,
    firstTokenAddress,
    secondTokenAddress,
    thirdTokenAddress,
    fourthTokenAddress,
  ] = accounts;

  let firstOracle: ConstantPriceOracleContract;
  let secondOracle: ConstantPriceOracleContract;
  let thirdOracle: ConstantPriceOracleContract;

  let firstOracleValue: BigNumber;
  let secondOracleValue: BigNumber;
  let thirdOracleValue: BigNumber;

  let oracleWhiteList: OracleWhiteListV2Contract;

  const oracleHelper = new OracleHelper(ownerAccount);

  before(async () => {
    ABIDecoder.addABI(OracleWhiteListV2.abi);
  });

  after(async () => {
    ABIDecoder.removeABI(OracleWhiteListV2.abi);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    firstOracleValue = new BigNumber(10 ** 18);
    secondOracleValue = new BigNumber(2 * 10 ** 18);
    thirdOracleValue = new BigNumber(3 * 10 ** 18);

    // Deploy oracles
    firstOracle = await oracleHelper.deployConstantPriceOracleAsync(firstOracleValue);
    secondOracle = await oracleHelper.deployConstantPriceOracleAsync(secondOracleValue);
    thirdOracle = await oracleHelper.deployConstantPriceOracleAsync(thirdOracleValue);
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('#constructor', async () => {
    let subjectInitialTokenAddresses: Address[];
    let subjectInitialOracleAddresses: Address[];
    let subjectCaller: Address;

    beforeEach(async () => {
      subjectInitialTokenAddresses = [
        firstTokenAddress,
        secondTokenAddress,
        thirdTokenAddress,
      ];
      subjectInitialOracleAddresses = [
        firstOracle.address,
        secondOracle.address,
        thirdOracle.address,
      ];
      subjectCaller = ownerAccount;
    });

    async function subject(): Promise<OracleWhiteListV2Contract> {
      return await oracleHelper.deployOracleWhiteListV2Async(
        subjectInitialTokenAddresses,
        subjectInitialOracleAddresses,
        subjectCaller
      );
    }

    it('creates a whitelist with the correct addresses', async () => {
      const oracleWhiteList = await subject();

      const addresses = await oracleWhiteList.validAddresses.callAsync();
      expect(addresses).to.deep.equal(subjectInitialTokenAddresses);

      subjectInitialTokenAddresses.forEach(async (address, index) => {
        const oracleAddress = await oracleWhiteList.oracleWhiteList.callAsync(address);
        expect(oracleAddress).to.equal(subjectInitialOracleAddresses[index]);
      });
    });

    describe('when the token and oracle arrays are different lengths', async () => {
      beforeEach(async () => {
        subjectInitialTokenAddresses = [
          firstTokenAddress,
          secondTokenAddress,
          thirdTokenAddress,
          fourthTokenAddress,
        ];
      });

      it('reverts', async () => {
        await expectRevertError(subject());
      });
    });
  });

  describe('#getOracleValuesByToken', async () => {
    let subjectTokenAddresses: Address[];

    beforeEach(async () => {
      oracleWhiteList = await oracleHelper.deployOracleWhiteListV2Async(
        [firstTokenAddress, secondTokenAddress, thirdTokenAddress],
        [firstOracle.address, secondOracle.address, thirdOracle.address]
      );

      subjectTokenAddresses = [firstTokenAddress, secondTokenAddress, thirdTokenAddress];
    });

    async function subject(): Promise<BigNumber[]> {
      return await oracleWhiteList.getOracleValuesByToken.callAsync(subjectTokenAddresses);
    }

    it('returns oracle values', async () => {
      const actualOracleValues = await subject();
      const expectedOracleValues = [firstOracleValue, secondOracleValue, thirdOracleValue];
      expect(JSON.stringify(actualOracleValues)).to.equal(JSON.stringify(expectedOracleValues));
    });

    describe('when one of the tokens is not whitelisted', async () => {
      beforeEach(async () => {
        subjectTokenAddresses = [firstTokenAddress, secondTokenAddress, thirdTokenAddress, fourthTokenAddress];
      });

      it('should revert', async () => {
        await expectRevertError(subject());
      });
    });

    describe('when passed array has no addresses', async () => {
      beforeEach(async () => {
        subjectTokenAddresses = [];
      });

      it('should revert', async () => {
        await expectRevertError(subject());
      });
    });
  });
});