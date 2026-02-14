$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $repoRoot

Write-Host "Starting Hardhat node in a new window..."
Start-Process powershell -ArgumentList @(
  "-NoProfile",
  "-Command",
  "cd `"$repoRoot`"; pnpm --filter contracts exec hardhat node --hostname 0.0.0.0"
)

Start-Sleep -Seconds 5

Write-Host "Deploying contracts to localhost..."
pnpm --filter contracts exec hardhat ignition deploy --network localhost ignition/modules/MedicalRecord.ts

Write-Host "Updating app envs with deployed contract address..."
pnpm set-local-address

Write-Host "Syncing ABI to web/mobile..."
pnpm sync-abi

Write-Host "Starting backend in a new window..."
Start-Process powershell -ArgumentList @(
  "-NoProfile",
  "-Command",
  "cd `"$repoRoot`"; pnpm --filter backend run dev"
)

Write-Host "Starting web in a new window..."
Start-Process powershell -ArgumentList @(
  "-NoProfile",
  "-Command",
  "cd `"$repoRoot`"; pnpm --filter web run dev"
)

Write-Host "Starting mobile (Expo) in a new window..."
Start-Process powershell -ArgumentList @(
  "-NoProfile",
  "-Command",
  "cd `"$repoRoot`"; pnpm --filter mobile run dev"
)
