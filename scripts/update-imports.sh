#!/bin/bash

# Script to update import paths to new src/ structure

echo "🔄 Updating import paths to new src/ structure..."

# Update component imports
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from ['\''"]@/components/ui/|from '\''@/components/ui/|g' \
  -e 's|from ['\''"]@/components/layout/|from '\''@/components/layout/|g' \
  -e 's|from ['\''"]@/components/offline/|from '\''@/components/offline/|g' \
  -e 's|from ['\''"]../components/|from '\''@/components/|g' \
  -e 's|from ['\''"]../../components/|from '\''@/components/|g' \
  -e 's|from ['\''"]../../../components/|from '\''@/components/|g' \
  {} \;

# Update service imports
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from ['\''"]@/features/auth/auth.service|from '\''@/services/auth/auth.service|g' \
  -e 's|from ['\''"]@/features/employees/employee.service|from '\''@/services/employees/employee.service|g' \
  -e 's|from ['\''"]@/features/attendance/attendance.service|from '\''@/services/attendance/attendance.service|g' \
  {} \;

# Update utils imports
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from ['\''"]@/lib/utils/|from '\''@/utils/|g' \
  -e 's|from ['\''"]@/lib/validations/|from '\''@/utils/validation/|g' \
  {} \;

echo "✅ Import paths updated!"
echo "⚠️  Please review changes and test the application"
