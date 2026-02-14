import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const artifactPath = path.resolve(
  repoRoot,
  "packages",
  "contracts",
  "artifacts",
  "contracts",
  "MedicalRecord.sol",
  "MedicalRecord.json",
);

const targets = [
  path.resolve(repoRoot, "apps", "web", "constants", "MedicalRecord.json"),
  path.resolve(repoRoot, "apps", "mobile", "constants", "MedicalRecord.json"),
];

async function main() {
  const artifactRaw = await fs.readFile(artifactPath, "utf8");
  const artifact = JSON.parse(artifactRaw);

  if (!artifact.abi) {
    throw new Error("ABI not found in artifact.");
  }

  const payload = JSON.stringify({ abi: artifact.abi }, null, 2) + "\n";

  await Promise.all(
    targets.map(async (target) => {
      await fs.writeFile(target, payload, "utf8");
    }),
  );

  console.log(
    `Synced ABI to:\n- ${targets[0]}\n- ${targets[1]}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
