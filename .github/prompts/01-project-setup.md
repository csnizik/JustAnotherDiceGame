# Prompt 01: Project Setup

## Objective

Initialize the TypeScript React project with all required dependencies and configuration.

## Instructions

### Step 1: Create React App with TypeScript

Create a new Vite React TypeScript project:

```bash
npm create vite@latest just-another-dice-game -- --template react-ts
cd just-another-dice-game
```

### Step 2: Install Dependencies

```bash
# Core dependency
npm install @3d-dice/dice-box

# Dev dependencies
npm install -D @types/node
```

### Step 3: Configure TypeScript

Update `tsconfig.json` with strict settings and path aliases:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/engines/*": ["./src/engines/*"],
      "@/services/*": ["./src/services/*"],
      "@/interfaces/*": ["./src/interfaces/*"],
      "@/types/*": ["./src/types/*"],
      "@/constants/*": ["./src/constants/*"],
      "@/context/*": ["./src/context/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Step 4: Configure Vite Path Aliases

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Step 5: Create Directory Structure

Create the following empty directories:

```
src/
├── interfaces/
├── types/
├── constants/
├── engines/
├── services/
├── hooks/
├── components/
│   ├── Game/
│   ├── DiceBoard/
│   ├── ScoreDisplay/
│   ├── PlayerControls/
│   ├── GameStatus/
│   └── shared/
├── context/
└── utils/
```

### Step 6: Copy Dice-Box Assets

The @3d-dice/dice-box package requires static assets. Copy them to public:

```bash
cp -r node_modules/@3d-dice/dice-box/dist/assets public/dice-box-assets
```

### Step 7: Create Base CSS Reset

Create `src/index.css` with a minimal reset:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

html,
body,
#root {
  height: 100%;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Step 8: Verify Setup

Run the development server to ensure everything compiles:

```bash
npm run dev
```

## Completion Checklist

- [ ] Vite React TypeScript project created
- [ ] @3d-dice/dice-box installed
- [ ] TypeScript strict mode configured
- [ ] Path aliases configured in both tsconfig and vite.config
- [ ] Directory structure created
- [ ] Dice-box assets copied to public
- [ ] Development server runs without errors

## Next Step

Proceed to `02-interfaces.md` to define type interfaces.
