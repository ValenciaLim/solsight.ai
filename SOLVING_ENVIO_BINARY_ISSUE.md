# Solving Envio Binary Issue in WSL

## The Problem

When you run `npm install -g envio` in WSL, it's still installing to the Windows npm directory (`/mnt/c/Users/Valencia/AppData/Roaming/npm/`) because WSL shares the Windows npm path.

This causes the binary to be Windows-compatible but fails when WSL tries to find Linux binaries.

## The Solution: Install Envio Locally

Instead of global installation, install Envio as a local project dependency:

### Step 1: Navigate to Your Project

```bash
cd /mnt/c/Users/Valencia/Downloads/SolSight/solana-nft-indexer
```

### Step 2: Install Envio Locally

```bash
npm install envio --save-dev
```

Or add it to your `package.json`:

```bash
npm init -y  # If you don't have package.json yet
npm install envio --save-dev
```

### Step 3: Use npx to Run Envio Commands

```bash
# Instead of: envio --version
npx envio --version

# Instead of: envio codegen
npx envio codegen

# Instead of: envio build
npx envio build

# Instead of: envio dev
npx envio dev
```

### Alternative: Configure npm Prefix in WSL

If you really want global installation, configure npm to use WSL's local directory:

```bash
# Create WSL npm directory
mkdir -p ~/.npm-global

# Configure npm to use it
npm config set prefix '~/.npm-global'

# Add to PATH in ~/.bashrc
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc

# Reload shell
source ~/.bashrc

# Now install Envio globally
npm install -g envio
```

## Recommended Approach

For this project, I recommend **local installation** because:

1. It's simpler and doesn't require npm path configuration
2. Each project has its own Envio version
3. No conflicts with Windows npm
4. Works immediately

## Quick Start After Installation

```bash
# Navigate to project
cd /mnt/c/Users/Valencia/Downloads/SolSight/solana-nft-indexer

# Generate types
npx envio codegen

# Build the indexer
npx envio build

# Run in dev mode
npx envio dev

# Deploy when ready
npx envio deploy
```

## Troubleshooting

If `npx envio` still shows the error:

```bash
# Clear npm cache
npm cache clean --force

# Remove any existing envio installation
npm uninstall envio
rm -rf node_modules package-lock.json

# Reinstall
npm install envio --save-dev

# Try again
npx envio --version
```
