# Quick Start Guide - MyProdusen HRIS Enhancement

**Last Updated:** 2026-05-15
**Version:** 2.0

---

## 🚀 Quick Deployment

### Step 1: Run Database Migration

```bash
# Generate and run migration
npm run db:migrate
```

This will create 14 new tables for Payroll, Overtime, and Reimbursement modules.

---

### Step 2: Seed Initial Data

Run this SQL to set up initial configuration:

```sql
-- 1. Create Overtime Rates
INSERT INTO "OvertimeRate" (id, name, multiplier, description, "isWeekday", "isWeekend", "isHoliday", "isActive", "createdAt", "updatedAt")
VALUES 
  ('ot_weekday', 'Weekday 1.5x', 1.5, 'Lembur hari kerja biasa', true, false, false, true, NOW(), NOW()),
  ('ot_weekend', 'Weekend 2x', 2.0, 'Lembur akhir pekan', false, true, false, true, NOW(), NOW()),
  ('ot_holiday', 'Holiday 3x', 3.0, 'Lembur hari libur nasional', false, false, true, true, NOW(), NOW());

-- 2. Create Expense Categories
INSERT INTO "ExpenseCategory" (id, name, description, "maxAmount", "requiresReceipt", "isActive", "createdAt", "updatedAt")
VALUES 
  ('exp_transport', 'Transport', 'Biaya transportasi', 500000, true, true, NOW(), NOW()),
  ('exp_meal', 'Makan', 'Biaya makan', 200000, true, true, NOW(), NOW()),
  ('exp_communication', 'Komunikasi', 'Pulsa dan internet', 300000, true, true, NOW(), NOW()),
  ('exp_other', 'Lain-lain', 'Biaya lainnya', 1000000, true, true, NOW(), NOW());

-- 3. Create Sample Payroll Structures
INSERT INTO "PayrollStructure" (id, name, description, "baseSalary", "isActive", "createdAt", "updatedAt")
VALUES 
  ('struct_staff1', 'Staff Level 1', 'Entry level staff', 5000000, true, NOW(), NOW()),
  ('struct_staff2', 'Staff Level 2', 'Mid level staff', 7000000, true, NOW(), NOW()),
  ('struct_supervisor', 'Supervisor', 'Supervisor level', 10000000, true, NOW(), NOW()),
  ('struct_manager', 'Manager', 'Manager level', 15000000, true, NOW(), NOW());

-- 4. Add Sample Payroll Components (for Staff Level 1)
INSERT INTO "PayrollComponent" (id, "structureId", name, type, amount, "isPercentage", "isTaxable", description, "createdAt", "updatedAt")
VALUES 
  ('comp_transport', 'struct_staff1', 'Tunjangan Transport', 'ALLOWANCE', 500000, false, true, 'Tunjangan transportasi bulanan', NOW(), NOW()),
  ('comp_meal', 'struct_staff1', 'Tunjangan Makan', 'ALLOWANCE', 300000, false, true, 'Tunjangan makan bulanan', NOW(), NOW()),
  ('comp_performance', 'struct_staff1', 'Tunjangan Kinerja', 'ALLOWANCE', 10, true, true, 'Tunjangan kinerja 10% dari gaji pokok', NOW(), NOW());
```

---

### Step 3: Build and Start

```bash
# Build the application
npm run build

# Start production server
npm start

# Or for development
npm run dev
```

---

## 🧪 Testing the New Features

### Test 1: Create Payroll Structure

1. Login as SUPERADMIN or ADMIN_HR
2. Navigate to `/dashboard/payroll/structures`
3. Click "Tambah Struktur"
4. Fill in:
   - Name: "Test Structure"
   - Base Salary: 5000000
5. Click "Simpan"
6. ✅ Structure should appear in the grid

### Test 2: Create Payroll Run

1. Navigate to `/dashboard/payroll`
2. Click "Buat Payroll Baru"
3. Select period (e.g., 2026-05)
4. Click "Buat"
5. Click "Calculate" on the new run
6. ✅ Payroll should be calculated with all employees

### Test 3: Submit Overtime Request

1. Login as EMPLOYEE
2. Navigate to `/dashboard/overtime`
3. Click "Request Lembur"
4. Fill in:
   - Date: Today
   - Start Time: 17:00
   - End Time: 20:00
   - Rate: Weekday 1.5x
   - Reason: "Menyelesaikan project urgent"
5. Click "Submit"
6. ✅ Request should appear in the table with PENDING status

### Test 4: Approve Overtime

1. Login as SUPERVISOR or ADMIN_HR
2. Navigate to `/dashboard/overtime`
3. Filter by "PENDING"
4. Click "Approve" on a request
5. ✅ Status should change to APPROVED

### Test 5: View Payroll Detail

1. Navigate to `/dashboard/payroll`
2. Click "Detail" on a calculated payroll run
3. ✅ Should see:
   - Summary cards (employees, gross, deductions, net)
   - Employee payroll items table
   - Overtime pay included (if any approved overtime)
   - Attendance deductions (if any absences)

---

## 📊 Sample Data for Testing

### Create Test Employee with Payroll

```sql
-- Assuming you have an employee with ID 'emp_test'
INSERT INTO "EmployeePayroll" (
  id, 
  "employeeId", 
  "structureId", 
  "baseSalary", 
  "effectiveDate",
  "bankName",
  "bankAccountNumber",
  "bankAccountName",
  "taxId",
  "createdAt",
  "updatedAt"
)
VALUES (
  'empay_test',
  'emp_test', -- Replace with actual employee ID
  'struct_staff1',
  5000000,
  '2026-01-01',
  'BCA',
  '1234567890',
  'John Doe',
  '12.345.678.9-012.345',
  NOW(),
  NOW()
);
```

---

## 🔍 Verification Checklist

After deployment, verify these:

### Database
- [ ] All 14 new tables created
- [ ] Overtime rates seeded (3 rates)
- [ ] Expense categories seeded (4 categories)
- [ ] Payroll structures seeded (4 structures)
- [ ] No migration errors

### API Endpoints
- [ ] GET `/api/payroll/structures` returns data
- [ ] GET `/api/overtime/rates` returns data
- [ ] GET `/api/reimbursement/categories` returns data
- [ ] POST endpoints require authentication
- [ ] RBAC working (employees can't access admin endpoints)

### Frontend
- [ ] `/dashboard/payroll` loads without errors
- [ ] `/dashboard/payroll/structures` loads without errors
- [ ] `/dashboard/overtime` loads without errors
- [ ] Stats cards show correct data
- [ ] Tables display data correctly
- [ ] Modals open and close properly
- [ ] Forms validate input
- [ ] CSV export works

### Business Logic
- [ ] Payroll calculation includes all components
- [ ] Tax calculation is correct
- [ ] BPJS calculation is correct
- [ ] Overtime pay calculation is correct
- [ ] Attendance deduction is correct
- [ ] Approval workflow works

---

## 🐛 Troubleshooting

### Migration Fails

**Error:** "Table already exists"
```bash
# Drop the tables and re-run
npm run db:drop
npm run db:migrate
```

### API Returns 401 Unauthorized

**Solution:** Make sure you're logged in and JWT token is valid
```bash
# Check browser console for token
# Clear cookies and login again
```

### Payroll Calculation Returns 0

**Possible causes:**
1. Employee doesn't have payroll assignment
2. No attendance data for the period
3. Payroll structure not configured

**Solution:**
```sql
-- Check employee payroll
SELECT * FROM "EmployeePayroll" WHERE "employeeId" = 'your_employee_id';

-- Check attendance
SELECT * FROM "Attendance" WHERE "employeeId" = 'your_employee_id';
```

### Overtime Pay Not Included in Payroll

**Possible causes:**
1. Overtime not approved
2. Overtime date outside payroll period

**Solution:**
```sql
-- Check overtime status
SELECT * FROM "OvertimeRequest" 
WHERE "employeeId" = 'your_employee_id' 
AND status = 'APPROVED';
```

---

## 📱 Mobile Testing

Test on mobile devices:

1. **iPhone Safari:**
   - [ ] All pages responsive
   - [ ] Tables scroll horizontally
   - [ ] Modals fit screen
   - [ ] Forms usable

2. **Android Chrome:**
   - [ ] All pages responsive
   - [ ] Touch targets adequate
   - [ ] No layout issues

---

## 🔐 Security Testing

### Test RBAC

1. **As EMPLOYEE:**
   - [ ] Can access `/dashboard/overtime`
   - [ ] Cannot access `/dashboard/payroll/structures`
   - [ ] Cannot approve overtime
   - [ ] Can only see own data

2. **As SUPERVISOR:**
   - [ ] Can approve overtime for team
   - [ ] Cannot access payroll structures
   - [ ] Can see team data only

3. **As ADMIN_HR:**
   - [ ] Can access all payroll features
   - [ ] Can approve overtime/reimbursement
   - [ ] Cannot delete payroll structures (SUPERADMIN only)

4. **As SUPERADMIN:**
   - [ ] Full access to all features
   - [ ] Can approve payroll runs
   - [ ] Can delete structures

---

## 📈 Performance Testing

### Load Test Payroll Calculation

```bash
# Test with 100 employees
# Expected: < 5 seconds

# Test with 500 employees
# Expected: < 15 seconds

# Test with 1000 employees
# Expected: < 30 seconds
```

### Database Query Performance

```sql
-- Check slow queries
EXPLAIN ANALYZE 
SELECT * FROM "PayrollItem" 
WHERE "runId" = 'your_run_id';

-- Should use index on runId
```

---

## 🎯 Success Criteria

Your deployment is successful if:

- ✅ All migrations run without errors
- ✅ All API endpoints return expected data
- ✅ All frontend pages load without errors
- ✅ Payroll calculation produces correct results
- ✅ Overtime approval workflow works
- ✅ RBAC prevents unauthorized access
- ✅ Mobile responsive works on all devices
- ✅ CSV export generates valid files

---

## 📞 Support

If you encounter issues:

1. Check logs: `npm run logs`
2. Check documentation: `docs/INDEX.md`
3. Check implementation status: `docs/HRIS_IMPLEMENTATION_STATUS.md`
4. Review feature guide: `docs/HRIS_FEATURES_SUMMARY.md`

---

## 🎉 Next Steps After Successful Deployment

1. **Train HR Staff:**
   - How to create payroll runs
   - How to approve overtime
   - How to manage structures

2. **Train Employees:**
   - How to submit overtime requests
   - How to submit reimbursement claims
   - How to view payslips

3. **Monitor:**
   - Check audit logs daily
   - Monitor payroll calculations
   - Review approval workflows

4. **Optimize:**
   - Add more payroll components
   - Configure tax brackets for your region
   - Customize BPJS rates if needed

---

**Ready to go! 🚀**

Run the migration, seed the data, and start testing!

