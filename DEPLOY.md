# Deploy Trail Connect on Vercel

## 1. Import the repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **Dilishaa108/Trail-Connect** from GitHub
3. Leave the framework preset as detected from `vercel.json` (Other)

## 2. Environment variables

In **Project → Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `DATABASE_URL` | Neon **pooled** connection string | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

**Neon:** In the Neon dashboard, copy the connection string labeled **Pooled connection** (not the direct one). It should look like:

`postgresql://user:pass@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`

## 3. Create database tables (one time)

After the first deploy, run locally with your Neon URL:

```bash
export DATABASE_URL="your-neon-pooled-url"
pnpm install
pnpm --filter @workspace/db run push
```

## 4. Redeploy

Trigger **Redeploy** in Vercel after env vars are saved.
