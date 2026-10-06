# StockPoint

An Expo SDK 57 retail operations app for a neighborhood store. The interface follows the StockPoint Figma concept and includes a dashboard, inventory, supplier orders, point of sale, checkout, receipts, reports, and store settings.

## Requirements

- Node.js LTS
- npm
- Expo Go on a physical device, or an Android/iOS emulator

## Setup and Run

```bash
npm install && npx expo start
```

After Expo starts, scan the QR code with Expo Go or press `a` for Android, `i` for iOS, or `w` for the web version.

The StockPoint Figma-style dashboard, inventory, and POS screens use the local SQLite products table. The inventory supports parameterized SQL search, add/delete actions, and stock increment/decrement; confirming a sale also updates persisted stock. The native Android/iOS app uses the synchronous SQLite API shown in the laboratory reference and seeds five sample products on first launch. The web app uses platform-specific asynchronous SQLite operations because synchronous web SQLite requires browser cross-origin isolation headers. Metro is configured to bundle SQLite's `.wasm` file.

## Project Structure

- `App.tsx` - application entry point
- `src/services/db.js` - SQLite database initialization and first-launch sample products
- `src/services/inventory.ts` - native product queries and CRUD/stock operations
- `src/services/inventory.web.ts` - web-compatible asynchronous product queries and CRUD/stock operations
- `src/components/StockPointApp.tsx` - StockPoint design and SQLite-backed dashboard, inventory, and POS flows

## Validation

Run the TypeScript check with:

```bash
npx tsc --noEmit
```

## Version Control

Generated dependencies and Expo build state are excluded from Git. In particular, `node_modules/` and `.expo/` must remain untracked.
