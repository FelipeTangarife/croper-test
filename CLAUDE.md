# CLAUDE.md

This file provides guidance to Claude Code

## Project Overview

**Product management** technical test. Monorepo with two projects:

- **`backend/`** — NestJS REST API (TypeScript, Mongoose, MongoDB), JWT auth, Swagger docs
- **`frontend/`** — React + Vite, TanStack Query + Zustand for state management + Tailwindcss

## Universal Engineering Rules
- Keep diffs focused and minimal.
- Avoid unrelated refactors.
- Fix root causes before symptoms.
- Never expose secrets or sensitive data in API responses.
- All code, comments and naming in **English**.
- **Never install libraries** without explaining why and getting approval.


**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No error handling for impossible scenarios.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting.
- Match existing style, even if you'd do it differently.
- Remove imports/variables/functions that YOUR changes made unused.

The test: every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Done means: builds, lint passes, tests pass.

## Architecture

### Backend Architecture

```
Controller (HTTP only) → Service (business logic) → Mongoose Model
```

```
src/
├── main.ts                
├── config/               
├── common/
│   ├── decorators/         
│   └── filters/            
├── auth/                 
├── users/                 
├── products/
│   ├── dto/        
│   ├── schemas/
│   ├── products.controller.ts
│   └── products.service.ts
└── seed/
```

### Frontend Architecture

```
Component → Hook → API 
```

```
src/
├── app/                   
├── lib/                    
├── features/
│   ├── auth/               
│   └── products/          
└── shared/       
```