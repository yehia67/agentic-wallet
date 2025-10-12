# 🚀 Deployment Management Guide

This comprehensive guide explains how to manage separate deployments for the frontend and backend applications, including troubleshooting common issues.

## Architecture Overview

The agentic-wallet project uses a **separate deployment strategy** with two independent Heroku applications:

- **Frontend**: Next.js application (UI/UX)
- **Backend**: NestJS API (Business logic & wallet operations)

## Heroku Applications

### Frontend App
- **Name**: `agentic-wallet`
- **URL**: `https://agentic-wallet-cb890a7a49a1.herokuapp.com/`
- **Purpose**: Serves the Next.js frontend application
- **Git Remote**: `https://git.heroku.com/agentic-wallet.git`

### Backend App
- **Name**: `agentic-wallet-api`
- **URL**: `https://agentic-wallet-api-68c26b243be1.herokuapp.com/`
- **Purpose**: Serves the NestJS API
- **Git Remote**: `https://git.heroku.com/agentic-wallet-api.git`

## Deployment Commands

### Check Current Apps
```bash
# List all your Heroku apps
heroku apps

# Get info about frontend app
heroku info -a agentic-wallet

# Get info about backend app
heroku info -a agentic-wallet-api
```

### Deploy Frontend Only
```bash
# Ensure you're using frontend configuration
git checkout main

# Deploy to frontend app
git remote add frontend https://git.heroku.com/agentic-wallet.git
git push frontend main

# Or using Heroku CLI
heroku git:remote -a agentic-wallet
git push heroku main
```

### Deploy Backend Only
```bash
# Switch to backend configuration
cp package.backend.json package.json
cp Procfile.backend Procfile

# Commit backend configuration
git add package.json Procfile
git commit -m "Switch to backend deployment config"

# Deploy to backend app
git remote add backend https://git.heroku.com/agentic-wallet-api.git
git push backend main

# Or using Heroku CLI
heroku git:remote -a agentic-wallet-api
git push heroku main

# Restore frontend configuration
git checkout HEAD~1 -- package.json Procfile
git add package.json Procfile
git commit -m "Restore frontend config"
```

## Configuration Files

### Frontend Configuration
- **Procfile**: `web: cd frontend && npm start`
- **package.json**: Frontend-only build and start scripts
- **heroku-postbuild**: `cd frontend && npm install && npm run build`

### Backend Configuration
- **Procfile.backend**: `web: cd backend && npm run start:prod`
- **package.backend.json**: Backend-only build and start scripts
- **heroku-postbuild**: `cd backend && npm install --legacy-peer-deps && npm run build`

## Environment Variables

### Frontend Environment Variables
Set these in the `agentic-wallet` app:

```bash
# Set frontend environment variables
heroku config:set NEXT_PUBLIC_API_URL=https://agentic-wallet-api-68c26b243be1.herokuapp.com -a agentic-wallet
heroku config:set NODE_ENV=production -a agentic-wallet
```

### Backend Environment Variables
Set these in the `agentic-wallet-api` app:

```bash
# Set backend environment variables
heroku config:set NODE_ENV=production -a agentic-wallet-api
heroku config:set OPEN_ROUTER_API_KEY=your_key_here -a agentic-wallet-api
heroku config:set ANTROPIC_API_KEY=your_key_here -a agentic-wallet-api
heroku config:set PRIVATE_KEY=your_private_key_here -a agentic-wallet-api
heroku config:set BASE_SCAN_USDC=0x036CbD53842c5426634e7929541eC2318f3dCF7e -a agentic-wallet-api
heroku config:set BASE_SCAN_EXPLORER=https://sepolia.basescan.org -a agentic-wallet-api
```

### View Environment Variables
```bash
# View frontend environment variables
heroku config -a agentic-wallet

# View backend environment variables
heroku config -a agentic-wallet-api
```

## Logs and Monitoring

### View Logs
```bash
# Frontend logs
heroku logs --tail -a agentic-wallet

# Backend logs
heroku logs --tail -a agentic-wallet-api

# Specific number of lines
heroku logs -n 100 -a agentic-wallet-api
```

### Monitor Applications
```bash
# Check frontend status
heroku ps -a agentic-wallet

# Check backend status
heroku ps -a agentic-wallet-api

# Restart applications if needed
heroku restart -a agentic-wallet
heroku restart -a agentic-wallet-api
```

## Automated Deployment (GitHub Actions)

The project includes GitHub Actions workflows for automated deployment.

### Current Workflow
- **Triggers**: Push to `main` branch
- **Deploys**: Frontend only (to `agentic-wallet` app)
- **File**: `.github/workflows/heroku-deploy.yml`

### Manual Backend Deployment
Backend deployments are currently manual. To automate:

1. Create `.github/workflows/heroku-deploy-backend.yml`
2. Configure separate workflow for backend
3. Use different triggers or paths

## Troubleshooting

### Common Issues

#### 1. Wrong App Deployment
**Problem**: Deployed backend code to frontend app or vice versa.

**Solution**:
```bash
# Check which app you're deploying to
git remote -v

# Remove wrong remote and add correct one
git remote remove heroku
git remote add heroku https://git.heroku.com/CORRECT_APP_NAME.git
```

#### 2. Environment Variables Not Set
**Problem**: App crashes due to missing environment variables.

**Solution**:
```bash
# Check current environment variables
heroku config -a APP_NAME

# Set missing variables
heroku config:set VARIABLE_NAME=value -a APP_NAME
```

#### 3. Build Failures
**Problem**: Build fails during deployment.

**Solution**:
```bash
# Check build logs
heroku logs -a APP_NAME

# Common fixes:
# - Ensure correct package.json is being used
# - Check if all dependencies are in dependencies (not devDependencies)
# - Verify Node.js version compatibility
```

#### 4. CORS Issues
**Problem**: Frontend can't connect to backend API.

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly in frontend
2. Check backend CORS configuration in `main.ts`
3. Ensure backend is running and accessible

### Health Checks

#### Frontend Health Check
```bash
# Check if frontend is running
curl https://agentic-wallet-cb890a7a49a1.herokuapp.com/

# Should return the Next.js application
```

#### Backend Health Check
```bash
# Check if backend API is running
curl https://agentic-wallet-api-68c26b243be1.herokuapp.com/

# Test specific endpoint
curl https://agentic-wallet-api-68c26b243be1.herokuapp.com/agent/message \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

## Best Practices

### 1. Deployment Strategy
- **Frontend**: Deploy when UI/UX changes are made
- **Backend**: Deploy when API or business logic changes are made
- **Both**: Deploy when there are breaking changes between frontend and backend

### 2. Environment Management
- Use different environment variables for staging and production
- Never commit sensitive information to git
- Use Heroku config vars for all environment-specific settings

### 3. Testing Before Deployment
```bash
# Test locally before deploying
npm run dev  # Test full stack locally

# Test frontend only
cd frontend && npm run dev

# Test backend only
cd backend && npm run start:dev
```

### 4. Rollback Strategy
```bash
# Rollback to previous release
heroku rollback -a agentic-wallet
heroku rollback -a agentic-wallet-api

# Rollback to specific version
heroku rollback v5 -a agentic-wallet-api
```

## Quick Reference

### Essential Commands
```bash
# Deploy frontend
heroku git:remote -a agentic-wallet && git push heroku main

# Deploy backend (with config switch)
cp package.backend.json package.json && cp Procfile.backend Procfile
git add . && git commit -m "Backend config"
heroku git:remote -a agentic-wallet-api && git push heroku main
git checkout HEAD~1 -- package.json Procfile

# View logs
heroku logs --tail -a agentic-wallet      # Frontend
heroku logs --tail -a agentic-wallet-api  # Backend

# Set environment variable
heroku config:set VAR_NAME=value -a APP_NAME

# Restart app
heroku restart -a APP_NAME
```

### URLs
- **Frontend**: https://agentic-wallet-cb890a7a49a1.herokuapp.com/
- **Backend API**: https://agentic-wallet-api-68c26b243be1.herokuapp.com/
- **Agent Endpoint**: https://agentic-wallet-api-68c26b243be1.herokuapp.com/agent/message

## 🚀 Quick Reference Commands

### Essential Commands
```bash
# Deploy frontend
heroku git:remote -a agentic-wallet && git push heroku main

# Deploy backend (with config switch)
cp package.backend.json package.json && cp Procfile.backend Procfile
git add . && git commit -m "Backend config"
heroku git:remote -a agentic-wallet-api && git push heroku main
git checkout HEAD~1 -- package.json Procfile

# View logs
heroku logs --tail -a agentic-wallet      # Frontend
heroku logs --tail -a agentic-wallet-api  # Backend

# Set environment variable
heroku config:set VAR_NAME=value -a APP_NAME

# Restart app
heroku restart -a APP_NAME

# Monitor status
heroku ps -a agentic-wallet               # Frontend
heroku ps -a agentic-wallet-api           # Backend
```

## 🆘 Enhanced Troubleshooting Guide

### Issue 1: Frontend Still Calling localhost:3001

**Problem**: Frontend shows `localhost:3001` in network requests instead of production API URL.

**Root Cause**: Next.js `NEXT_PUBLIC_*` environment variables are built into the client bundle at build time.

**Solution**:
```bash
# 1. Verify environment variable is set
heroku config -a agentic-wallet
# Should show: NEXT_PUBLIC_API_URL: https://agentic-wallet-api-68c26b243be1.herokuapp.com/

# 2. Trigger frontend rebuild (required!)
git commit --allow-empty -m "Trigger frontend rebuild with new API URL"
heroku git:remote -a agentic-wallet
git push heroku main

# 3. Verify in build logs
heroku logs --tail -a agentic-wallet
# Look for Next.js picking up the environment variable during build
```

**Prevention**: Always redeploy frontend after changing `NEXT_PUBLIC_*` variables.

### Issue 2: Backend API Missing Environment Variables

**Problem**: Backend crashes with errors like:
```
Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable
```

**Root Cause**: Environment variables not set in the backend Heroku app.

**Solution**:
```bash
# Set all backend environment variables at once
heroku config:set \
  OPEN_ROUTER_API_KEY=your_actual_key_here \
  ANTROPIC_API_KEY=your_actual_key_here \
  PRIVATE_KEY=your_actual_private_key_here \
  OPEN_ROUTER_THINK_MODEL_PROVIDER=openai \
  OPEN_ROUTER_THINK_MODEL_NAME=gpt-4o-mini \
  OPEN_ROUTER_RESEARCH_MODEL_PROVIDER=perplexity \
  OPEN_ROUTER_RESEARCH_MODEL_NAME=sonar-pro \
  BASE_SCAN_USDC=0x036CbD53842c5426634e7929541eC2318f3dCF7e \
  BASE_SCAN_EXPLORER=https://sepolia.basescan.org \
  NODE_ENV=production \
  -a agentic-wallet-api

# Restart to apply changes
heroku restart -a agentic-wallet-api

# Verify variables are set
heroku config -a agentic-wallet-api
```

### Issue 3: Wrong App Deployment

**Problem**: Deployed backend code to frontend app or vice versa.

**Symptoms**:
- Frontend app shows API errors
- Backend app shows Next.js build errors
- Wrong process types running

**Solution**:
```bash
# Check which app you're deploying to
git remote -v

# Remove wrong remote and add correct one
git remote remove heroku
git remote add heroku https://git.heroku.com/CORRECT_APP_NAME.git

# Verify app info
heroku info -a CORRECT_APP_NAME
```

### Issue 4: Build Failures

**Problem**: Build fails during deployment.

**Common Causes & Solutions**:

#### A. Dependencies in wrong section
```bash
# Check build logs
heroku logs -a APP_NAME

# If "module not found" errors:
# Move build dependencies from devDependencies to dependencies
# Example: @nestjs/cli, typescript, @tailwindcss/postcss
```

#### B. Node.js version incompatibility
```bash
# Check engines in package.json
# Ensure compatibility: "node": ">=18.0.0"
```

#### C. Legacy peer dependencies (NestJS)
```bash
# For backend builds, use --legacy-peer-deps
# Already configured in package.backend.json
```

### Issue 5: CORS Issues

**Problem**: Frontend can't connect to backend API.

**Symptoms**:
- Network errors in browser console
- "CORS policy" errors
- Failed API requests

**Solution**:
```bash
# 1. Verify frontend API URL
heroku config -a agentic-wallet
# Should show correct backend URL

# 2. Check backend CORS configuration
# Backend main.ts should have:
# app.enableCors({ origin: '*', ... })

# 3. Test backend directly
curl https://agentic-wallet-api-68c26b243be1.herokuapp.com/

# 4. Test API endpoint
curl https://agentic-wallet-api-68c26b243be1.herokuapp.com/agent/message \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "what are the best ETH entry points"}'
```

### Issue 6: App Not Starting

**Problem**: Heroku app crashes on startup.

**Diagnosis Steps**:
```bash
# 1. Check app status
heroku ps -a APP_NAME

# 2. View recent logs
heroku logs --tail -a APP_NAME

# 3. Check for common issues:
# - Missing environment variables
# - Port binding issues
# - Dependency errors
# - Build artifacts missing
```

**Solutions by Error Type**:

#### Port Binding Error
```bash
# Ensure app listens on process.env.PORT
# Backend main.ts should have:
# const port = process.env.PORT || process.env.API_PORT || 3001;
```

#### Missing Build Artifacts
```bash
# Redeploy to rebuild
git commit --allow-empty -m "Force rebuild"
git push heroku main
```

### Issue 7: Environment Variable Not Taking Effect

**Problem**: Set environment variable but app still uses old value.

**Solution**:
```bash
# 1. Verify variable is set
heroku config -a APP_NAME

# 2. Restart app (required for most variables)
heroku restart -a APP_NAME

# 3. For NEXT_PUBLIC_* variables, redeploy frontend
git commit --allow-empty -m "Apply new environment variables"
git push heroku main
```

### Issue 8: Deployment Timeout

**Problem**: Deployment takes too long and times out.

**Solutions**:
```bash
# 1. Check build logs for hanging processes
heroku logs --tail -a APP_NAME

# 2. Clear build cache
heroku plugins:install heroku-builds
heroku builds:cache:purge -a APP_NAME

# 3. Optimize package.json scripts
# Remove unnecessary postinstall scripts
# Use --production flag for npm install
```

## 🔍 Diagnostic Commands

### Health Checks
```bash
# Frontend health check
curl https://agentic-wallet-cb890a7a49a1.herokuapp.com/

# Backend health check
curl https://agentic-wallet-api-68c26b243be1.herokuapp.com/

# Check app processes
heroku ps -a agentic-wallet
heroku ps -a agentic-wallet-api

# Check recent releases
heroku releases -a agentic-wallet
heroku releases -a agentic-wallet-api
```

### Log Analysis
```bash
# Real-time logs
heroku logs --tail -a APP_NAME

# Specific number of lines
heroku logs -n 100 -a APP_NAME

# Filter by process type
heroku logs --ps web -a APP_NAME

# Search logs
heroku logs -a APP_NAME | grep "ERROR"
```

## 🔄 Rollback Procedures

### Emergency Rollback
```bash
# Rollback to previous release
heroku rollback -a APP_NAME

# Rollback to specific version
heroku rollback v5 -a APP_NAME

# Check rollback status
heroku releases -a APP_NAME
```

### Planned Rollback
```bash
# 1. Identify target release
heroku releases -a APP_NAME

# 2. Test rollback in staging first (if available)

# 3. Execute rollback
heroku rollback vX -a APP_NAME

# 4. Verify functionality
curl https://APP_URL/
```

## 📋 Pre-Deployment Checklist

### Before Deploying Frontend
- [ ] Environment variables set correctly
- [ ] API URL points to production backend
- [ ] Local build works: `cd frontend && npm run build`
- [ ] No hardcoded localhost references

### Before Deploying Backend
- [ ] All API keys and secrets set
- [ ] Database connections configured
- [ ] CORS settings allow frontend domain
- [ ] Local build works: `cd backend && npm run build`
- [ ] Environment-specific configurations updated

### After Deployment
- [ ] Health checks pass
- [ ] Logs show no errors
- [ ] Frontend can connect to backend
- [ ] Core functionality works end-to-end

## 🆘 Emergency Contacts & Resources

### When All Else Fails
1. **Check this troubleshooting guide first**
2. **Review Heroku logs for specific errors**
3. **Test locally to isolate the issue**
4. **Check GitHub Actions workflow status**
5. **Verify environment variables are correct**
6. **Consider rolling back to last working version**

### Useful Heroku Resources
- [Heroku Node.js Troubleshooting](https://devcenter.heroku.com/articles/troubleshooting-node-deploys)
- [Heroku Build Logs](https://devcenter.heroku.com/articles/build-logs)
- [Heroku Config Vars](https://devcenter.heroku.com/articles/config-vars)

Remember: Each app is independent, so changes to one don't affect the other unless there are API contract changes.
