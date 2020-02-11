import * as _ from 'lodash';
import { Address } from 'set-protocol-utils';

import {
  MedianContract,
  OracleWhiteList,
  StandardTokenMockContract,
  WethMockContract,
  WhiteList,
  WhiteListContract,
} from 'set-protocol-contracts';

import {
  DEFAULT_GAS,
} from '../constants';
import { getWeb3 } from '../web3Helper';
import { getDeployedAddress } from '../snapshotUtils';

const web3 = getWeb3();


export class ProtocolHelper {
  private _tokenOwnerAddress: Address;

  constructor(tokenOwnerAddress: Address) {
    this._tokenOwnerAddress = tokenOwnerAddress;
  }

  /* ============ Deployed Contracts ============ */

  public async getDeployedWhiteList(): Promise<WhiteListContract> {
    const address = await getDeployedAddress(WhiteList.contractName);

     return await WhiteListContract.at(address, web3, {});
  }

  public async getDeployedWBTCMedianizerAsync(): Promise<MedianContract> {
    const address = await getDeployedAddress('WBTC_MEDIANIZER');

     return await MedianContract.at(address, web3, {});
  }

  public async getDeployedWETHMedianizerAsync(): Promise<MedianContract> {
    const address = await getDeployedAddress('WETH_MEDIANIZER');

     return await MedianContract.at(address, web3, {});
  }

  public async getDeployedWBTCAsync(): Promise<StandardTokenMockContract> {
    const address = await getDeployedAddress('WBTC');

     return await StandardTokenMockContract.at(address, web3, {});
  }

  public async getDeployedWETHAsync(): Promise<WethMockContract> {
    const address = await getDeployedAddress('WETH');

     return await WethMockContract.at(address, web3, {});
  }

  public async getDeployedDAIAsync(): Promise<StandardTokenMockContract> {
    const address = await getDeployedAddress('DAI');

     return await StandardTokenMockContract.at(address, web3, {});
  }

  public async deployWhiteListAsync(
    initialAddresses: Address[] = [],
    from: Address = this._tokenOwnerAddress
  ): Promise<string> {
    const instance = await new web3.eth.Contract(WhiteList.abi).deploy({
      data: WhiteList.bytecode,
      arguments: [
        initialAddresses,
      ],
    }).send({ from, gas: DEFAULT_GAS });

    return instance.options.address;
  }

  public async deployOracleWhiteListAsync(
    initialTokenAddresses: Address[] = [],
    initialOracleAddresses: Address[] = [],
    from: Address = this._tokenOwnerAddress
  ): Promise<string> {
    const instance = await new web3.eth.Contract(OracleWhiteList.abi).deploy({
      data: OracleWhiteList.bytecode,
      arguments: [
        initialTokenAddresses,
        initialOracleAddresses,
      ],
    }).send({ from, gas: DEFAULT_GAS });

    return instance.options.address;
  }
  /* ============ CoreFactory Extension ============ */

  public async addTokenToWhiteList(
    address: Address,
    whiteList: WhiteListContract,
    from: Address = this._tokenOwnerAddress,
  ): Promise<void> {
    await whiteList.addAddress.sendTransactionAsync(
      address,
      { from, gas: DEFAULT_GAS },
    );
  }
}
