# Moire — Faceted Knowledge Graph Navigation

# Development server (port 3000)
dev:
    npm run dev

# Production build
build:
    npm run build

# Start production server
start:
    npm run start

# Type check
check:
    npm run type-check

# Lint
lint:
    npm run lint

# Install dependencies
install:
    npm install --legacy-peer-deps

# Full CI check
ci: check lint build

# Clean build artifacts
clean:
    rm -rf .next node_modules/.cache
