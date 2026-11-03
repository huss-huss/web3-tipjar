# frontend

Next.js + wagmi + viem UI for web3-tipjar.

```bash
npm ci
cp .env.example .env.local   # set chain id and contract addresses
npm run dev
npm run lint
npm run build
```

Configuration is read from `NEXT_PUBLIC_*` variables (see `.env.example`).
ABIs in `src/contracts/abis.ts` are generated from the contracts with
`npm run export-abis` in `contracts/`. See the [root README](../README.md).
