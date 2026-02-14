# MedicalRecord Contracts

This package contains the MedicalRecord smart contract used by the web and mobile apps.

## What the contract does

- Stores patient record metadata (IPFS hash, filename, uploader, timestamp).
- Lets hospitals/doctors/insurers request access to a patient's records.
- Lets patients approve or reject requests.
- Enforces access control for viewing and adding records.

## Local development

```shell
pnpm --filter contracts exec hardhat test
pnpm --filter contracts exec hardhat compile
```

## Deploy with Ignition

```shell
pnpm --filter contracts exec hardhat ignition deploy ignition/modules/MedicalRecord.ts
```

## Sepolia deployment

Set the configuration variables used by `hardhat.config.ts`:

```shell
pnpm --filter contracts exec hardhat keystore set SEPOLIA_PRIVATE_KEY
pnpm --filter contracts exec hardhat keystore set SEPOLIA_RPC_URL
```

Then deploy:

```shell
pnpm --filter contracts exec hardhat ignition deploy --network sepolia ignition/modules/MedicalRecord.ts
```
