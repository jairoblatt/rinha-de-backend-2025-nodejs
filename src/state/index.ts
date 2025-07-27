import { BitPackingPaymentStorage, StorageEntry } from "./bitPacking";

export { StorageEntry };

export interface State {
  default: BitPackingPaymentStorage;
  fallback: BitPackingPaymentStorage;
}

const state: State = {
  default: new BitPackingPaymentStorage(),
  fallback: new BitPackingPaymentStorage(),
};

export default state;
