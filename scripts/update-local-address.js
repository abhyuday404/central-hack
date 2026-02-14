import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const deploymentPath = path.resolve(
  repoRoot,
  "packages",
  "contracts",
  "ignition",
  "deployments",
  "chain-31337",
  "deployed_addresses.json",
);

const addressKey = "MedicalRecordModule#MedicalRecord";

const targets = [
  {
    file: path.resolve(repoRoot, "apps", "web", ".env"),
    example: path.resolve(repoRoot, "apps", "web", ".env.example"),
    key: "NEXT_PUBLIC_MEDICAL_RECORD_ADDRESS",
  },
  {
    file: path.resolve(repoRoot, "apps", "mobile", ".env"),
    example: path.resolve(repoRoot, "apps", "mobile", ".env.example"),
    key: "EXPO_PUBLIC_MEDICAL_RECORD_ADDRESS",
  },
];

async function readEnvFile(filePath, examplePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    try {
      return await fs.readFile(examplePath, "utf8");
    } catch {
      return "";
    }
  }
}

function upsertEnv(content, key, value) {
  const lines = content.split(/\r?\n/);
  let found = false;
  const updated = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`${key}=${value}`);
  }

  return updated
    .filter((line, index, arr) => !(index === arr.length - 1 && line === ""))
    .join("\n")
    .trimEnd()
    .concat("\n");
}

async function main() {
  const raw = await fs.readFile(deploymentPath, "utf8");
  const deployments = JSON.parse(raw);
  const address = deployments[addressKey];

  if (!address) {
    throw new Error(`Missing ${addressKey} in ${deploymentPath}`);
  }

  await Promise.all(
    targets.map(async ({ file, example, key }) => {
      const content = await readEnvFile(file, example);
      const nextContent = upsertEnv(content, key, address);
      await fs.writeFile(file, nextContent, "utf8");
      console.log(`Updated ${key} in ${file}`);
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
