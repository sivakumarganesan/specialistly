#!/bin/bash
# This script compares production vs staging to identify the issue

echo "🔍 PRODUCTION vs STAGING COMPARISON"
echo "===================================="
echo ""

# Test endpoints
echo "1️⃣  Testing API Endpoints"
echo "------------------------"

echo ""
echo "Staging:"
curl -s -H "X-Customer-Email: sinduja.vel@gmail.com" "https://staging.specialistly.com/api/courses/enrollments/self-paced/my-courses" | jq '.data | length' 2>/dev/null || echo "Error"

echo ""
echo "Production:"
curl -s -H "X-Customer-Email: sinduja.vel@gmail.com" "https://specialistly.com/api/courses/enrollments/self-paced/my-courses" | jq '.data | length' 2>/dev/null || echo "Error"

echo ""
echo "2️⃣  Possible Issues:"
echo "-------------------"
echo "❌ Staging returns 4 courses"
echo "❌ Production returns 0 courses"
echo ""
echo "Root Cause Analysis Needed:"
echo "  1. Check if production database has same customer data"
echo "  2. Check if production database enrollments exist"
echo "  3. Verify schema is deployed to production"
echo "  4. Check environment differences (prod vs staging)"
echo "  5. Verify customer IDs match between environments"
