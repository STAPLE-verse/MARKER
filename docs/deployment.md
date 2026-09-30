# MARKER Deployment Strategy

This document outlines the deployment process and requirements for the **MARKER** platform. 

## 1. Core Philosophy: The Subservice
MARKER is designed as a standalone Next.js application, but it operates logically as a subservice of the **STAPLE** ecosystem. 

**Critical Deployment Rule:** MARKER does **NOT** own its database. It connects directly to the STAPLE database. 

## 2. Infrastructure Requirements

Because MARKER relies on STAPLE's infrastructure, it has specific networking and environment requirements:

### Database Connection
- MARKER must be deployed in an environment that has network access to the STAPLE PostgreSQL database.
- **Migrations:** The MARKER deployment pipeline must **never** run database migrations (`npx prisma migrate deploy`). Migrations are strictly handled by STAPLE.
- **Generation:** The MARKER build step must run `npx prisma generate` to build its local TypeScript client based on its `schema.prisma` file.

### Environment Variables
For MARKER to function and for Single Sign-On (SSO) to work, the following environment variables are strictly required:

```env
# Must point to the STAPLE database instance
DATABASE_URL="postgresql://user:password@host:port/staple_db"

# Must be EXACTLY THE SAME as STAPLE's AUTH_SECRET to share JWT cookies
AUTH_SECRET="your-super-secret-auth-key-change-in-production"
```

## 3. Subdomain and SSO Configuration

To enable seamless user flow, MARKER should be deployed on a subdomain of the STAPLE root domain (e.g., `marker.staple-verse.org` and `app.staple-verse.org`).

Because both applications run on the same root domain and share the exact same `AUTH_SECRET`, cookies set by STAPLE will be automatically read and trusted by MARKER's Auth.js setup, creating a zero-latency Single Sign-On experience.

## 4. Build and Deployment Steps

MARKER is a standard Next.js App Router project and can be deployed to Vercel, AWS Amplify, or inside a Docker container.

**Standard Build Pipeline:**
1. `npm install` (Install dependencies)
2. `npx prisma generate` (Generate the database types)
3. `npm run build` (Build the Next.js production bundle)
4. `npm start` (Start the Node.js server)

*Note: Since MARKER has no database migrations to run and relies entirely on shared UI packages and STAPLE's DB, its deployment pipeline is exceptionally fast and stateless.*

## 5. Email

MARKER sends email through Resend, the same provider and account as STAPLE. Set `RESEND_API_KEY` to STAPLE's key; without it MARKER runs normally but sends no email.

### Scheduled notification emails

Like STAPLE's `cron/cronJobDailyMailer.mjs` and `cronJobWeeklyMailer.mjs`, MARKER emails people a daily or weekly roundup of their MARKER notifications. Who gets which one comes from the email frequency on their **STAPLE profile** (`User.emailProjectActivityFrequency`: never, daily, or weekly); MARKER has no setting of its own.

The roundup does not run by itself. Set `CRON_SECRET`, then have a scheduler call the endpoint once a day and once a week. With crontab on the server, as STAPLE does:

```cron
# every day at 08:00
0 8 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" "https://<marker-host>/api/cron/notification-digest?frequency=daily"
# every Monday at 08:00
0 8 * * 1 curl -fsS -H "Authorization: Bearer $CRON_SECRET" "https://<marker-host>/api/cron/notification-digest?frequency=weekly"
```

The daily call covers the last 24 hours and the weekly call the last 7 days, so each should run exactly that often. The response reports how many emails were sent and how many failed.
