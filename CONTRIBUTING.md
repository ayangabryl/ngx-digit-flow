# Contributing

## Bugs and feature requests

Open an issue on GitHub. For bugs, include the Angular version, browser, and a minimal reproduction.

## Pull requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm test` and ensure tests pass
4. Open a pull request with a clear description of what changed and why

## Development setup

```bash
# Install dependencies
npm install

# Start demo site (localhost:4200)
npm start

# Build the library
ng build ngx-digit-flow

# Run tests
npm test
```

## Project structure

```
packages/   library source (DigitFlowComponent, DigitFlowGroupDirective)
site/       demo + docs site
skills/     AI agent skill definition
```

## Code style

Prettier is configured at `.prettierrc`. Run `npx prettier --write .` before committing.
