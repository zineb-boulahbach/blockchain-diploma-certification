/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation, and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * https://trufflesuite.com/docs/truffle/reference/configuration
 *
 * Hands-off deployment with Infura
 * --------------------------------
 *
 * Do you have a complex application that requires lots of transactions to deploy?
 * Use this approach to make deployment a breeze 🏖️:
 *
 * Infura deployment needs a wallet provider (like @truffle/hdwallet-provider)
 * to sign transactions before they're sent to a remote public node.
 * Infura accounts are available for free at 🔍: https://infura.io/register
 *
 * You'll need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. You can store your secrets 🤐 in a .env file.
 * In your project root, run `$ npm install dotenv`.
 * Create .env (which should be .gitignored) and declare your MNEMONIC
 * and Infura PROJECT_ID variables inside.
 * For example, your .env file will have the following structure:
 *
 * MNEMONIC = <Your 12 phrase mnemonic>
 * PROJECT_ID = <Your Infura project id>
 *
 * Deployment with Truffle Dashboard (Recommended for best security practice)
 * --------------------------------------------------------------------------
 *
 * Are you concerned about security and minimizing rekt status 🤔?
 * Use this method for best security:
 *
 * Truffle Dashboard lets you review transactions in detail, and leverages
 * MetaMask for signing, so there's no need to copy-paste your mnemonic.
 * More details can be found at 🔎:
 *
 * https://trufflesuite.com/docs/truffle/getting-started/using-the-truffle-dashboard/
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

/**
 * Load `.env` at repo root and `client/.env`. Later files only fill keys that
 * are missing or empty — so Truffle picks up `DEPLOYER_PRIVATE_KEY` /
 * `SEPOLIA_RPC_URL` even when they live next to the Vite env vars.
 */
function mergeEnvFiles() {
  const files = [
    path.join(__dirname, ".env"),
    path.join(__dirname, "client", ".env"),
  ];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let raw = fs.readFileSync(file, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    const parsed = dotenv.parse(raw);
    for (const [key, value] of Object.entries(parsed)) {
      const cur = process.env[key];
      if (cur === undefined || cur === "") {
        process.env[key] = value;
      }
    }
  }
}
mergeEnvFiles();

const ganache = require("ganache");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const { RetryingJsonRpcProvider } = require("./scripts/retrying-json-rpc-provider");
const testProvider = ganache.provider({
  logging: { quiet: true },
  chain: { chainId: 1337, networkId: 1337 },
});

function normalizePrivateKey(key) {
  const t = String(key ?? "").trim();
  if (!t) return t;
  return t.startsWith("0x") ? t : `0x${t}`;
}

function createSepoliaProvider() {
  mergeEnvFiles();
  const rpcUrl = String(process.env.SEPOLIA_RPC_URL ?? "").trim();
  const pk = normalizePrivateKey(process.env.DEPLOYER_PRIVATE_KEY);
  if (!rpcUrl || !pk) {
    throw new Error(
      "Missing SEPOLIA_RPC_URL or DEPLOYER_PRIVATE_KEY in .env (root or client/.env) for Sepolia deployment."
    );
  }
  const httpProvider = new RetryingJsonRpcProvider(rpcUrl, {
    maxRetries: 8,
    timeoutMs: 90000,
  });
  const wallet = new HDWalletProvider({
    privateKeys: [pk],
    providerOrUrl: httpProvider,
    chainId: 11155111,
    pollingInterval: 12000,
  });
  // Truffle's connection check reads `provider.host`; HDWalletProvider omits it → "network at undefined".
  try {
    const u = new URL(rpcUrl);
    wallet.host = u.host;
  } catch {
    wallet.host = httpProvider.host || "sepolia-rpc";
  }
  return wallet;
}

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a managed Ganache instance for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache, geth, or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
     development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
     },
     test: {
      provider: () => testProvider,
      network_id: "*",
     },
     sepolia: {
      provider: () => createSepoliaProvider(),
      network_id: 11155111,
      confirmations: 1,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 90000,
     },
    //
    // An additional network, but with some advanced options…
    // advanced: {
    //   port: 8777,             // Custom port
    //   network_id: 1342,       // Custom network
    //   gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
    //   gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
    //   from: <address>,        // Account to send transactions from (default: accounts[0])
    //   websocket: true         // Enable EventEmitter interface for web3 (default: false)
    // },
    //
    // Useful for deploying to a public network.
    // Note: It's important to wrap the provider as a function to ensure truffle uses a new provider every time.
    // goerli: {
    //   provider: () => new HDWalletProvider(MNEMONIC, `https://goerli.infura.io/v3/${PROJECT_ID}`),
    //   network_id: 5,       // Goerli's id
    //   confirmations: 2,    // # of confirmations to wait between deployments. (default: 0)
    //   timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
    //   skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    // },
    //
    // Useful for private networks
    // private: {
    //   provider: () => new HDWalletProvider(MNEMONIC, `https://network.io`),
    //   network_id: 2111,   // This network is yours, in the cloud.
    //   production: true    // Treats this network as if it was a public net. (default: false)
    // }
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.21",
      settings: {
        optimizer: { enabled: true, runs: 200 },
        viaIR: true,
      },
    }
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled:
  // false to enabled: true. The default storage location can also be
  // overridden by specifying the adapter settings, as shown in the commented code below.
  //
  // NOTE: It is not possible to migrate your contracts to truffle DB and you should
  // make a backup of your artifacts to a safe location before enabling this feature.
  //
  // After you backed up your artifacts you can utilize db by running migrate as follows:
  // $ truffle migrate --reset --compile-all
  //
  // db: {
  //   enabled: false,
  //   host: "127.0.0.1",
  //   adapter: {
  //     name: "indexeddb",
  //     settings: {
  //       directory: ".db"
  //     }
  //   }
  // }
};
