# Vercel Deployment Guide

## Environment Variables Setup

Add these environment variables in your Vercel dashboard:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/orbitos

# Security
JWT_SECRET=your-secure-32-char-random-string

# Environment
NODE_ENV=production
```

## MongoDB Atlas Setup

1. Create MongoDB Atlas account
2. Create new cluster
3. Add database user
4. Whitelist Vercel IPs (0.0.0.0/0 for all)
5. Get connection string

## Vercel Deployment

```bash
npm install -g vercel
vercel --prod
```

## Environment Variables Commands

```bash
# Set via Vercel CLI
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add NODE_ENV
```