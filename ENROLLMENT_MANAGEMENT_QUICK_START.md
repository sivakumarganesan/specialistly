# Admin Enrollment Management - Quick Start Guide

## Accessing the Feature

1. Log in to the admin dashboard with your admin credentials
2. Navigate to the **Enrollment Management** tab
3. You're ready to manage enrollments!

## Managing Course Enrollments

### Step 1: Select a Course
- Click the "Select Course" dropdown
- Choose the course you want to manage
- The system will load all enrolled customers

### Step 2: View Enrolled Customers
Once a course is selected, you'll see a table of all enrolled customers showing:
- **Name**: Customer full name
- **Email**: Customer email address
- **Status**: Shows "Paid" (green) or "Pending" (yellow)
- **Enrolled Date**: When customer enrolled
- **Type**: "Self-Paced" or "Cohort"
- **Actions**: Remove button (trash icon)

### Step 3: Search for Specific Customers
- Use the search box to filter by customer email or name
- Search is case-insensitive
- Filters update the table in real-time

## Adding a Customer to a Course

### When to Use This
- Customer paid but wasn't enrolled due to system error
- Customer lost access and needs to be re-enrolled
- Manual override for special cases

### Steps to Add
1. Click the **"Add Enrollment"** button (blue button with + icon)
2. Fill in the dialog:
   - **Customer ID** (required): Unique customer identifier
   - **Customer Email** (required): Customer's email address
   - **Reason** (optional): Why you're adding them (e.g., "System error correction", "Payment verification")
   - **Notes** (optional): Additional context (e.g., "Customer reported no access after payment")
3. Click **"Add Enrollment"** to confirm
4. You'll see a success message and the customer appears in the table immediately

### What Happens
- Customer is enrolled with `paymentStatus: 'completed'`
- Customer gains immediate access to the course
- Action is logged in the audit trail with your details and reason
- Customer will see the course in their dashboard

## Removing a Customer from a Course

### When to Use This
- Customer requests to be removed
- Accidental duplicate enrollment
- Enrollment error that needs correction
- Customer exceeded allowed access period

### Steps to Remove
1. In the enrollments table, find the customer to remove
2. Click the **trash icon** on the right side of their row
3. Confirm the removal when prompted (click OK on confirmation dialog)
4. Customer will be removed immediately
5. You'll see a success message

### What Happens
- Enrollment is deleted from the system
- Customer loses access to the course immediately
- For cohort courses: cohort enrollment count is decreased
- Action is logged in the audit trail
- Reason automatically recorded as "Admin removal"

## Viewing the Audit Trail

### Why Check the Audit Trail
- See history of all manual enrollment changes
- Track which admin made changes and when
- Understand the reason for each change
- Verify system safety and accountability

### Steps to View
1. Click the **"Audit Trail"** button
2. A dialog will open showing recent enrollment changes
3. Each entry shows:
   - **Action**: "Added" or "Removed"
   - **Customer Name & Email**: Who was affected
   - **Timestamp**: When the action occurred  
   - **Reason**: Why the action was taken
   - **Notes**: Additional context
   - **Admin**: Who performed the action and their email

## Common Scenarios

### Scenario 1: Customer Can't Access After Payment
**Problem**: Customer paid for course but can't see it in their account

**Solution**:
1. Verify payment was processed
2. Go to Enrollment Management
3. Select the course
4. Click "Add Enrollment"
5. Enter customer ID and email
6. Set Reason: "Payment processed but enrollment not created"
7. Notes: "Payment ID: [payment_id]"
8. Click "Add Enrollment"
9. Customer will have access within seconds

### Scenario 2: Duplicate Enrollment
**Problem**: Customer accidentally enrolled twice

**Solution**:
1. Select the course
2. Find the customer in the list
3. Click trash to remove one enrollment
4. Confirm removal
5. Customer keeps their primary enrollment

### Scenario 3: Audit Check
**Problem**: Need to verify enrollment changes made today

**Solution**:
1. Select the course
2. Click "Audit Trail"
3. Review all changes with timestamps
4. Export as needed for compliance records

## Tips & Best Practices

✅ **Do:**
- Always enter a reason when adding/removing enrollments
- Use audit trail to verify high-value enrollment changes
- Document special cases in the notes field
- Remove duplicate enrollments promptly
- Track system errors for pattern analysis

❌ **Don't:**
- Remove active students without verification
- Add customers without confirming their identity
- Skip entering reasons for actions
- Ignore audit trail discrepancies

## Troubleshooting

### "Customer already enrolled" Error
- Customer is already in this course/cohort
- Try removing them first, then re-adding if needed
- Check if customer is enrolled in a different cohort of the same course

### "Please fill in all required fields" Error
- Customer ID is missing
- Customer Email is missing
- Fill in both required fields and try again

### Can't see the course in the dropdown
- You may not have products created yet
- Contact system administrator
- Ensure courses are published

### Adding succeeded but customer still can't access
- May take up to 1-2 minutes to sync
- Have customer clear browser cache
- Ask customer to log out and back in
- Check customer's email for course access confirmation

## Getting Help

If you encounter issues:
1. Check the error message displayed
2. Review the Audit Trail for related actions
3. Take a screenshot showing the problem
4. Contact technical support with:
   - Screenshot
   - Course name/ID
   - Customer email
   - Steps you took before the error
   - Error message shown

## Key Metrics to Monitor

Track these to ensure system health:
- **Total Enrollments**: Growing over time
- **Manual Additions**: Should be small % of total  
- **Removal Rate**: Monitor for unusual patterns
- **Error Messages**: Track for system issues
- **Reason Categories**: Identify common problems

---

**Last Updated**: 2024  
**Version**: 1.0  
**For Questions**: Contact Administrator
