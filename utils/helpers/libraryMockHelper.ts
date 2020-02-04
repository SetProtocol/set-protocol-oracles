import { Address } from 'set-protocol-utils';
import {
  DataSourceLinearInterpolationLibraryMockContract,
  EMALibraryMockContract,
  RSILibraryMockContract,
  LinkedListHelperMockContract,
  LinkedListLibraryMockContract,
  LinkedListLibraryMockV2Contract,
  LinkedListLibraryMockV3Contract,
  PriceFeedMockContract,
} from '../contracts';
import {
  getContractInstance,
  txnFrom,
} from '../web3Helper';

const DataSourceLinearInterpolationLibraryMock = artifacts.require('DataSourceLinearInterpolationLibraryMock');
const LinkedListHelperMock = artifacts.require('LinkedListHelperMock');
const LinkedListLibraryMock = artifacts.require('LinkedListLibraryMock');
const LinkedListLibraryMockV2 = artifacts.require('LinkedListLibraryMockV2');
const LinkedListLibraryMockV3 = artifacts.require('LinkedListLibraryMockV3');
const EMALibraryMock = artifacts.require('EMALibraryMock');
const PriceFeedMock = artifacts.require('PriceFeedMock');
const RSILibraryMock = artifacts.require('RSILibraryMock');

export class LibraryMockHelper {
  private _contractOwnerAddress: Address;

  constructor(contractOwnerAddress: Address) {
    this._contractOwnerAddress = contractOwnerAddress;
  }

  /* ============ Deployment ============ */

  public async deployEMALibraryMockAsync(
    from: Address = this._contractOwnerAddress
  ): Promise<EMALibraryMockContract> {
    const emaLibraryMockContract = await EMALibraryMock.new(txnFrom(from));

    return new EMALibraryMockContract(
      getContractInstance(emaLibraryMockContract),
      txnFrom(from),
    );
  }

  public async deployPriceFeedMockAsync(
    priceFeed: Address,
    from: Address = this._contractOwnerAddress
  ): Promise<PriceFeedMockContract> {
    const priceFeedTruffle = await PriceFeedMock.new(
      priceFeed,
      txnFrom(from),
    );

    return new PriceFeedMockContract(
      getContractInstance(priceFeedTruffle),
      txnFrom(from),
    );
  }

  public async deployLinkedListHelperMockAsync(
    from: Address = this._contractOwnerAddress
  ): Promise<LinkedListHelperMockContract> {
    const linkedListHelper = await LinkedListHelperMock.new(txnFrom(from));

    return new LinkedListHelperMockContract(
      getContractInstance(linkedListHelper),
      txnFrom(from),
    );
  }

  public async deployLinkedListLibraryMockAsync(
    from: Address = this._contractOwnerAddress
  ): Promise<LinkedListLibraryMockContract> {
    const linkedList = await LinkedListLibraryMock.new(txnFrom(from));

    return new LinkedListLibraryMockContract(
      getContractInstance(linkedList),
      txnFrom(from),
    );
  }

  public async deployDataSourceLinearInterpolationLibraryMockAsync(
    from: Address = this._contractOwnerAddress
  ): Promise<DataSourceLinearInterpolationLibraryMockContract> {
    const interpolationLib = await DataSourceLinearInterpolationLibraryMock.new(txnFrom(from));

    return new DataSourceLinearInterpolationLibraryMockContract(
      getContractInstance(interpolationLib),
      txnFrom(from),
    );
  }

  public async deployLinkedListLibraryMockV2Async(
    from: Address = this._contractOwnerAddress
  ): Promise<LinkedListLibraryMockV2Contract> {
    const linkedList = await LinkedListLibraryMockV2.new(txnFrom(from));

    return new LinkedListLibraryMockV2Contract(
      getContractInstance(linkedList),
      txnFrom(from),
    );
  }

  public async deployLinkedListLibraryMockV3Async(
    from: Address = this._contractOwnerAddress
  ): Promise<LinkedListLibraryMockV3Contract> {
    const linkedList = await LinkedListLibraryMockV3.new(txnFrom(from));

    return new LinkedListLibraryMockV3Contract(
      getContractInstance(linkedList),
      txnFrom(from),
    );
  }

  public async deployRSILibraryMockAsync(
    from: Address = this._contractOwnerAddress
  ): Promise<RSILibraryMockContract> {
    const rsiLibraryMockContract = await RSILibraryMock.new(txnFrom(from));

    return new RSILibraryMockContract(
      getContractInstance(rsiLibraryMockContract),
      txnFrom(from),
    );
  }
}
