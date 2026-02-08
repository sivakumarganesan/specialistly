# User-Managed OAuth 2.0 - Deployment & Maintenance Checklist

## ✅ Pre-Deployment Checklist

### Code Review
- [x] All code files created and integrated
- [x] No breaking changes to existing code
- [x] Error handling implemented for all scenarios
- [x] Input validation on all endpoints
- [x] Logging at appropriate levels
- [x] No hardcoded credentials
- [x] No console.logs left in production code
- [x] TypeScript/JSDoc comments added

### Security Review
- [x] State token validation implemented
- [x] CSRF protection via state tokens
- [x] Token storage is secure (MongoDB)
- [x] Tokens never exposed in API responses
- [x] HTTPS required in production
- [x] SQL injection not possible (using MongoDB)
- [x] XSS vulnerabilities prevented
- [x] CORS configured appropriately
- [x] Rate limiting ready to add

### Database Review
- [x] UserOAuthToken schema created
- [x] Indexes created for performance
- [x] Data validation in schema
- [x] Relationships properly defined
- [x] No circular dependencies
- [x] Timestamp fields included
- [x] Default values appropriate
- [x] Field types correct

### Documentation Review
- [x] USER_MANAGED_OAUTH_GUIDE.md complete
- [x] USER_MANAGED_OAUTH_QUICK_START.md complete
- [x] USER_MANAGED_OAUTH_DEVELOPER_REFERENCE.md complete
- [x] USER_MANAGED_OAUTH_IMPLEMENTATION_COMPLETE.md complete
- [x] USER_MANAGED_OAUTH_ARCHITECTURE.md complete
- [x] USER_MANAGED_OAUTH_INDEX.md complete
- [x] USER_MANAGED_OAUTH_SUMMARY.md complete
- [x] API endpoints documented
- [x] Error codes documented
- [x] Troubleshooting guide included

### Testing Checklist
- [ ] Unit tests for userManagedOAuthService
- [ ] Integration tests for OAuth flow
- [ ] Error scenario tests
- [ ] Database query tests
- [ ] Load testing
- [ ] Security testing

## 📋 Production Deployment Steps

### Step 1: Zoom App Configuration (15 minutes)
- [ ] Create Zoom OAuth app at https://marketplace.zoom.us/develop/create
- [ ] Select "User-managed app" type
- [ ] Fill in app information:
  - [ ] App Name: `Specialistly User OAuth`
  - [ ] Company name
  - [ ] Developer name
  - [ ] Support email
- [ ] Save app creation
- [ ] Go to app credentials
- [ ] Copy Client ID
- [ ] Copy Client Secret
- [ ] Set Redirect URI: `https://yourdomain.com/api/zoom/oauth/user-callback`
- [ ] Save all changes

### Step 2: Enable OAuth Scopes (10 minutes)
In Zoom App Marketplace → App Credentials → Scopes section:
- [ ] Enable `meeting:read`
- [ ] Enable `meeting:write`
- [ ] Enable `recording:read`
- [ ] Enable `user:read`
- [ ] Enable `user:write`
- [ ] Save scopes

### Step 3: Prepare Environment (5 minutes)
Update `.env` file in `backend/` directory:
```bash
# User-Managed OAuth Configuration
ZOOM_USER_MANAGED_CLIENT_ID=your_actual_client_id_here
ZOOM_USER_MANAGED_CLIENT_SECRET=your_actual_secret_here
ZOOM_REDIRECT_URI=https://yourdomain.com/api/zoom/oauth/user-callback
```
- [ ] Verify no typos
- [ ] Ensure quotes are correct
- [ ] Test values with test API call
- [ ] File permissions correct
- [ ] Not committed to git (check .gitignore)

### Step 4: Backend Configuration (5 minutes)
- [ ] Verify server.js has zoomRoutes registered
- [ ] Check all imports in controllers
- [ ] Verify database connection working
- [ ] Test MongoDB connection
- [ ] Check Node version compatibility (14+)

### Step 5: Deploy Code (10 minutes)
- [ ] Pull latest code
- [ ] Install any new dependencies (npm install)
- [ ] Build frontend if needed (npm run build)
- [ ] No compilation errors
- [ ] No TypeScript errors
- [ ] No linting warnings in OAuth files

### Step 6: Start Backend (5 minutes)
- [ ] Kill any existing Node processes
- [ ] Start fresh: `node server.js`
- [ ] Check for startup errors
- [ ] Verify database connection
- [ ] Verify routes registered
- [ ] Check OAuth credentials loaded
- [ ] No initialization errors in logs

### Step 7: Initial Testing (30 minutes)
Basic endpoint testing:
```bash
# Test 1: Health check
curl http://localhost:5001/api/health

# Test 2: Get authorization URL
curl "http://localhost:5001/api/zoom/oauth/user/authorize?userId=TEST_USER_ID"
# Should return { success: true, authUrl: "https://..." }

# Test 3: Check status (not authorized yet)
curl "http://localhost:5001/api/zoom/oauth/user/status?userId=TEST_USER_ID"
# Should return { success: true, authorized: false }

# Test 4: Authorization flow (manual)
# Open authUrl in browser → Authorize → Check callback
```

- [ ] GET /authorize returns valid URL
- [ ] User can click URL and see Zoom auth
- [ ] Callback handler working
- [ ] Tokens stored in database
- [ ] Status check shows authorized
- [ ] Zoom profile endpoint works
- [ ] Meetings list endpoint works
- [ ] Manual refresh works
- [ ] Revoke endpoint works

## 🔄 Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor error logs continuously
- [ ] Check database for token records
- [ ] Verify auto-refresh working
- [ ] Test with multiple users
- [ ] Monitor CPU/memory usage
- [ ] Check API response times
- [ ] Verify no token leaks in logs
- [ ] Test error scenarios
- [ ] Verify HTTPS working
- [ ] Check CORS headers

### First Week
- [ ] Daily log review
- [ ] Monitor token refresh success rate
- [ ] Check for failed authorizations
- [ ] Verify database indexes working
- [ ] Monitor database query times
- [ ] Check for rate limiting issues
- [ ] Verify no security alerts
- [ ] Test failover scenarios
- [ ] Monitor third-party API limits

### Ongoing Monitoring

#### Daily Checks
```bash
# Check token health
db.useroauthtokens.find({ 
  refreshErrorCount: { $gt: 0 } 
}).count()

# Check active authorizations
db.useroauthtokens.find({ 
  isActive: true, 
  isRevoked: false 
}).count()

# Check for errors
grep "Error\|error\|ERROR" backend.log | tail -20
```

- [ ] No excessive errors
- [ ] Refresh success rate > 99%
- [ ] Response times normal
- [ ] Database size monitoring

#### Weekly Checks
```bash
# Active users
db.useroauthtokens.find({ isActive: true }).count()

# Revoked tokens
db.useroauthtokens.find({ isRevoked: true }).count()

# Recent failures
db.useroauthtokens.find({ 
  refreshErrorCount: { $gte: 5 } 
})
```

- [ ] Review authorization trends
- [ ] Check revocation patterns
- [ ] Verify error counts acceptable
- [ ] Update dashboards
- [ ] Review API usage

#### Monthly Checks
- [ ] Full security audit
- [ ] Database optimization
- [ ] Token expiry patterns
- [ ] User feedback review
- [ ] Performance baseline
- [ ] Backup verification
- [ ] Disaster recovery test

## 🐛 Troubleshooting Guide

### Issue: OAuth app not found
**Symptoms:** 
- GET /authorize returns error about missing credentials
- Logs show `ZOOM_USER_MANAGED_CLIENT_ID not configured`

**Resolution:**
1. Verify OAuth app exists in Zoom Marketplace
2. Check `.env` has correct Client ID
3. Restart backend after `.env` changes
4. Test with: `echo $ZOOM_USER_MANAGED_CLIENT_ID`

### Issue: Redirect URI mismatch
**Symptoms:**
- After user authorizes, redirect fails
- Zoom shows "Invalid redirect URI"
- Error: `redirect_uri_mismatch`

**Resolution:**
1. Verify exact URL in Zoom app settings
2. Must match `ZOOM_REDIRECT_URI` exactly
3. Must include full path: `/api/zoom/oauth/user-callback`
4. Must use HTTPS in production
5. Restart backend after changes

### Issue: State token invalid/expired
**Symptoms:**
- OAuth callback fails with "Invalid state token"
- User took > 10 minutes before authorizing
- "State token expired" error

**Resolution:**
1. State tokens expire after 10 minutes (by design)
2. User must start over if > 10 minutes
3. Check server time synchronized (NTP)
4. Verify database clock accurate

### Issue: Token refresh failing
**Symptoms:**
- GET /profile returns 401
- Logs show "Token refresh failed"
- refreshErrorCount incrementing

**Resolution:**
1. Check Zoom API status at https://status.zoom.us/
2. Verify network connectivity
3. Check refresh token not revoked
4. Test manually: POST /oauth/user/refresh
5. Increase retry timeout if network slow
6. User may need to re-authorize

### Issue: No tokens in database
**Symptoms:**
- OAuth flow completes but UserOAuthToken collection empty
- Status shows "not authorized" after authorization

**Resolution:**
1. Check MongoDB connection working
2. Verify database `specialistdb` exists
3. Check collection created with `db.createCollection('useroauthtokens')`
4. Review backend logs for database errors
5. Check database user has write permissions
6. Review token exchange logs

### Issue: High response times
**Symptoms:**
- /authorize endpoint slow (>1 second)
- /profile endpoint very slow (>3 seconds)
- Zoom API calls timing out

**Resolution:**
1. Check network connectivity to Zoom API
2. Verify database indexes created
3. Monitor Zoom API rate limits (not exceeded)
4. Add database query caching
5. Implement response caching
6. Check server CPU/memory usage

## 📊 Metrics to Track

### Success Metrics
- **Authorization Success Rate**: >= 99%
- **Token Refresh Success Rate**: >= 99.5%
- **Mean Response Time**: < 500ms
- **P99 Response Time**: < 2000ms
- **Error Rate**: < 0.5%

### Health Metrics
```javascript
db.useroauthtokens.aggregate([
  {
    $group: {
      _id: null,
      active: { $sum: { $cond: ["$isActive", 1, 0] } },
      revoked: { $sum: { $cond: ["$isRevoked", 1, 0] } },
      errors: { $sum: "$refreshErrorCount" },
      total: { $sum: 1 }
    }
  }
])
```

### Performance Metrics
- Authorization initiation: track P50/P95/P99
- OAuth callback: track code exchange time
- Token refresh: track refresh latency
- API calls: track endpoint response times
- Database: track query times

## 🔄 Maintenance Tasks

### Daily (Automated)
- [ ] Rotate logs
- [ ] Clean up expired state tokens (handled in code)
- [ ] Monitor error logs

### Weekly
- [ ] Review authorization trends
- [ ] Check refresh error rates
- [ ] Verify database backups
- [ ] Review security logs
- [ ] Update documentation if needed

### Monthly
- [ ] Full security audit
- [ ] Database maintenance
- [ ] Review Zoom API changelog
- [ ] Update dependencies (npm update)
- [ ] Performance optimization review

### Quarterly
- [ ] Disaster recovery drill
- [ ] Penetration testing
- [ ] Capacity planning
- [ ] Architecture review
- [ ] Complete documentation review

## 🚨 Incident Response

### Critical Incident: Tokens Not Working
1. [ ] Check Zoom API status
2. [ ] Verify backend connectivity
3. [ ] Check database connection
4. [ ] Review error logs
5. [ ] Check `.env` configuration
6. [ ] Restart backend if needed
7. [ ] Contact Zoom support if persists

### High Priority: Refresh Errors Spike
1. [ ] Check Zoom API status
2. [ ] Review recent code changes
3. [ ] Check network connectivity
4. [ ] Verify database performance
5. [ ] Roll back if recent changes
6. [ ] Increase monitoring intervals
7. [ ] Prepare customer communication

### Medium Priority: High Response Times
1. [ ] Check server resources (CPU/mem)
2. [ ] Monitor database query times
3. [ ] Check network latency
4. [ ] Review Zoom API performance
5. [ ] Enable caching if applicable
6. [ ] Scale if needed

## 📞 Escalation Path

**Level 1: Automated Alerts**
- Error rate > 1%
- Response time > 3s (P99)
- Refresh failure rate > 2%

**Level 2: Manual Review**
- Investigate root cause
- Check logs
- Verify configuration
- Test manually

**Level 3: Incident Commander**
- Declare incident
- Notify stakeholders
- Implement emergency fixes
- Plan long-term solution

**Level 4: Post-Incident**
- Root cause analysis
- Implement permanent fix
- Update documentation
- Train team
- Monitor improvements

## ✅ Go-Live Checklist

Before going live to production:
- [ ] All pre-deployment checks passed
- [ ] Code deployed successfully
- [ ] All endpoints tested manually
- [ ] OAuth flow tested end-to-end
- [ ] Database health verified
- [ ] Monitoring configured
- [ ] Alerting configured
- [ ] Runbook created
- [ ] Team trained
- [ ] Backup verified
- [ ] Disaster recovery plan ready
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] Performance baseline established
- [ ] Production credentials secure

## 📞 Support Contacts

- **Zoom Support**: https://support.zoom.us/
- **MongoDB Support**: https://support.mongodb.com/
- **Backend Team**: [team contact]
- **On-Call**: [rotation link]

---

**Status: Ready for deployment!** ✅

Last Updated: January 29, 2026
