# DOrSU Campus Pass

An Expo SDK 57 student digital pass for Davao Oriental State University. The app demonstrates a modular React Native interface for student identity, pass status, profile editing, avatar selection, and campus gate-entry tracking.

## Requirements

- Node.js LTS
- npm
- Expo Go on a physical device, or an Android/iOS emulator

## Setup and Run

```bash
npm install && npx expo start
```

After Expo starts, scan the QR code with Expo Go or press `a` for Android, `i` for iOS, or `w` for the web version.

## Project Structure

- `App.tsx` - application composition, profile editing, pass status, and modal flows
- `src/components/StudentCard.tsx` - student identity card and status display
- `src/components/StatusBadge.tsx` - active/inactive pass badge
- `src/components/ScanCounter.tsx` - campus gate-entry counter
- `src/types/student.ts` - shared student profile types

## Validation

Run the TypeScript check with:

```bash
npx tsc --noEmit
```

## Version Control

Generated dependencies and Expo build state are excluded from Git. In particular, `node_modules/` and `.expo/` must remain untracked.
