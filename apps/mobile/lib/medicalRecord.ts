import { BrowserProvider, Contract } from "ethers";
import type { Provider } from "@reown/appkit-common-react-native";
import MedicalRecord from "@/constants/MedicalRecord.json";
import { MEDICAL_RECORD_ADDRESS } from "@/constants/address";

const abi = MedicalRecord.abi as const;

export type AccessRequest = {
  requester: string;
  timestamp: bigint;
  status: bigint;
};

export type RecordItem = {
  ipfsHash: string;
  fileName: string;
  doctor: string;
  timestamp: bigint;
};

export async function getMedicalRecordContract(provider: Provider) {
  const ethersProvider = new BrowserProvider(provider as any);
  const signer = await ethersProvider.getSigner();
  return new Contract(MEDICAL_RECORD_ADDRESS, abi, signer);
}

export function requestStatusLabel(status: bigint) {
  switch (Number(status)) {
    case 0:
      return "Pending";
    case 1:
      return "Approved";
    case 2:
      return "Rejected";
    default:
      return "Unknown";
  }
}
