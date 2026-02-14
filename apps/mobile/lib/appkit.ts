import { createAppKit } from "@reown/appkit-react-native";
import type { AppKitNetwork } from "@reown/appkit-common-react-native";
import { EthersAdapter } from "@reown/appkit-ethers-react-native";
import { asyncStorage } from "./storage";

const projectId =
  process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "missing_project_id";

const chainId = Number(process.env.EXPO_PUBLIC_CHAIN_ID ?? "31337");
const rawRpcUrl = process.env.EXPO_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";
const rpcUrl = /^https?:\/\//i.test(rawRpcUrl)
  ? rawRpcUrl
  : `http://${rawRpcUrl}`;

if (!projectId || projectId === "missing_project_id") {
  console.warn(
    "WalletConnect Project ID is missing. Set EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID in apps/mobile/.env.",
  );
}

console.log("AppKit config", {
  chainId,
  rpcUrl,
});

const networkName =
  chainId === 11155111 ? "Sepolia" : chainId === 1 ? "Ethereum" : "Localhost";

const defaultNetwork: AppKitNetwork = {
  id: chainId,
  name: networkName,
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
    public: {
      http: [rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: chainId === 11155111 ? "Sepolia Etherscan" : "Block Explorer",
      url:
        chainId === 11155111
          ? "https://sepolia.etherscan.io"
          : "http://localhost",
    },
  },
  chainNamespace: "eip155",
  caipNetworkId: `eip155:${chainId}`,
  testnet: chainId !== 1,
};

type AppKitInstance = ReturnType<typeof createAppKit>;

let _appKit: AppKitInstance | null = null;

/**
 * Lazily create and return the singleton AppKit instance.
 *
 * This is intentionally **not** created at module-evaluation time so that
 * callers (e.g. `_layout.tsx`) can clear stale WalletConnect session data
 * from AsyncStorage *before* the underlying `UniversalProvider.init()`
 * reads from the same storage.  Without this deferral, a cached session
 * that contains a malformed RPC URL (missing `http://` scheme) will crash
 * inside `@walletconnect/jsonrpc-http-connection` on startup.
 */
export function getAppKit(): AppKitInstance {
  if (!_appKit) {
    _appKit = createAppKit({
      projectId,
      metadata: {
        name: "Central Hack",
        description: "Patient record access approvals",
        url: "https://central-hack.local",
        icons: ["https://central-hack.local/icon.png"],
      },
      adapters: [new EthersAdapter()],
      networks: [defaultNetwork],
      defaultNetwork,
      storage: asyncStorage,
      enableAnalytics: false,
      themeMode: "light",
    });
  }
  return _appKit;
}
