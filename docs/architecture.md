# Target Architecture & Tech Stack

This document outlines the architectural decisions and technology stack for the **MARKER** platform, specifically detailing how it integrates within the broader **STAPLE** ecosystem.

## 1. Core Technology Stack

- **Framework**: Next.js (App Router)
- **UI & Styling**: Tailwind CSS v4, DaisyUI v5, and Heroicons
- **Database**: PostgreSQL (running locally via Docker)
- **ORM**: Prisma
- **Authentication**: Auth.js (NextAuth beta)

## 2. Repository Strategy: Multi-Repo, Not Monorepo

We have deliberately chosen **not** to use a Monorepo to combine MARKER and STAPLE.

**Rationale**: 
STAPLE relies on an older version of Next.js and Blitz.js, which is incompatible with the modern Next.js App Router setup used by MARKER. A monorepo would introduce significant dependency conflicts.

Instead, MARKER and STAPLE exist as completely independent repositories. This ensures that:
- MARKER can be deployed entirely on its own.
- STAPLE can be deployed entirely on its own.
- Developers can clone and run just one piece of the infrastructure without heavy overhead.

## 3. Shared UI Components

To ensure visual consistency between STAPLE and MARKER without a monorepo, we are adopting a decoupled component strategy:

- **Current State**: Reusable UI components (buttons, cards, etc.) are being built strictly inside the `components/ui/` directory within the MARKER repository. They are built as "dumb" components, completely isolated from application business logic.
- **Target State (The NPM Package)**: Once the component library matures, the `components/ui/` directory will be extracted into a separate, third repository. This library will be bundled and published as an NPM package. Both STAPLE and MARKER will then simply `npm install` this package to share the exact same UI elements.

## 4. Authentication Strategy (Federated SSO)

MARKER requires the ability to be deployed standalone, but also needs to share user logins with STAPLE when deployed together.

**The Solution**:
- **Standalone Authentication**: MARKER has its own dedicated database and manages its own `User` and `Session` tables using Prisma and Auth.js. If deployed independently, it functions as a completely self-contained application.
- **Ecosystem Single Sign-On (SSO)**: When deployed alongside STAPLE, the two applications will share a top-level domain (e.g., `.staple-verse.org`). STAPLE (which has existing users) will issue a secure JWT or session token as a domain-wide cookie. MARKER's Auth.js will be configured to automatically read this cookie, verify it, and seamlessly log the user in without requiring STAPLE's database credentials. 

This federated approach guarantees that MARKER never has a hard dependency on STAPLE, preserving maximum portability.
