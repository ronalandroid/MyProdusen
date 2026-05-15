#!/usr/bin/env node
/**
 * Environment Validation Script
 * Validates all required environment variables before deployment
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Required environment variables
const requiredVars = [
  {
    name: 'DATABASE_URL',
    description: 'PostgreSQL connection string',
    validate: (value) => {
      if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
        return 'Must be a valid PostgreSQL connection string';
      }
      if (process.env.NODE_ENV === 'production' && !value.includes('ssl=true') && !value.includes('sslmode=')) {
        return 'WARNING: SSL not enabled for production database';
      }
      return null;
    },
  },
  {
    name: 'JWT_SECRET',
    description: 'Secret key for JWT token signing',
    validate: (value) => {
      if (value.length < 32) {
        return 'Must be at least 32 characters long';
      }
      if (value === 'dev-only-secret-change-me') {
        return 'Must not use default development secret in production';
      }
      if (value.toLowerCase().includes('secret') || value.toLowerCase().includes('password')) {
        return 'WARNING: Avoid using common words in JWT secret';
      }
      return null;
    },
  },
  {
    name: 'NODE_ENV',
    description: 'Application environment',
    validate: (value) => {
      if (!['development', 'production', 'test'].includes(value)) {
        return 'Must be one of: development, production, test';
      }
      return null;
    },
  },
];

// Optional but recommended variables
const optionalVars = [
  {
    name: 'NEXT_PUBLIC_APP_URL',
    description: 'Public URL of the application',
    recommended: true,
  },
  {
    name: 'UPLOAD_DIR',
    description: 'Directory for file uploads',
    recommended: true,
  },
  {
    name: 'MAX_UPLOAD_SIZE',
    description: 'Maximum upload size in bytes',
    recommended: true,
  },
  {
    name: 'DEFAULT_GEOFENCE_RADIUS',
    description: 'Default geofence radius in meters',
    recommended: true,
  },
  {
    name: 'REDIS_URL',
    description: 'Redis connection URL for caching',
    recommended: true,
  },
  {
    name: 'CACHE_ENABLED',
    description: 'Enable/disable caching',
    recommended: true,
  },
];

// Production-specific checks
const productionChecks = [
  {
    name: 'SUPERADMIN_EMAIL',
    check: (value) => {
      if (value) {
        return 'WARNING: SUPERADMIN_EMAIL should be removed after initial setup';
      }
      return null;
    },
  },
  {
    name: 'SUPERADMIN_PASSWORD',
    check: (value) => {
      if (value) {
        return 'WARNING: SUPERADMIN_PASSWORD should be removed after initial setup';
      }
      return null;
    },
  },
];

function validateEnvironment() {
  log('\n🔍 Validating Environment Variables\n', 'blue');
  
  let errors = 0;
  let warnings = 0;
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check required variables
  log('Required Variables:', 'blue');
  requiredVars.forEach(({ name, description, validate }) => {
    const value = process.env[name];
    
    if (!value) {
      logError(`${name} is not set - ${description}`);
      errors++;
    } else {
      const error = validate ? validate(value) : null;
      if (error) {
        if (error.startsWith('WARNING:')) {
          logWarning(`${name}: ${error}`);
          warnings++;
        } else {
          logError(`${name}: ${error}`);
          errors++;
        }
      } else {
        logSuccess(`${name} is set`);
      }
    }
  });
  
  // Check optional variables
  log('\nOptional Variables:', 'blue');
  optionalVars.forEach(({ name, description, recommended }) => {
    const value = process.env[name];
    
    if (!value) {
      if (recommended && isProduction) {
        logWarning(`${name} is not set - ${description} (recommended for production)`);
        warnings++;
      } else {
        logInfo(`${name} is not set - ${description}`);
      }
    } else {
      logSuccess(`${name} is set`);
    }
  });
  
  // Production-specific checks
  if (isProduction) {
    log('\nProduction-Specific Checks:', 'blue');
    productionChecks.forEach(({ name, check }) => {
      const value = process.env[name];
      const warning = check(value);
      if (warning) {
        logWarning(warning);
        warnings++;
      }
    });
  }
  
  // Check .env file exists
  log('\nFile Checks:', 'blue');
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    logSuccess('.env file exists');
  } else {
    logWarning('.env file not found (using system environment variables)');
    warnings++;
  }
  
  // Check uploads directory
  const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
  if (fs.existsSync(uploadDir)) {
    logSuccess(`Upload directory exists: ${uploadDir}`);
  } else {
    logWarning(`Upload directory does not exist: ${uploadDir} (will be created on first upload)`);
    warnings++;
  }
  
  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('Validation Summary:', 'blue');
  log('='.repeat(50), 'blue');
  
  if (errors === 0 && warnings === 0) {
    logSuccess('All checks passed! Environment is ready for deployment.');
    return 0;
  } else {
    if (errors > 0) {
      logError(`Found ${errors} error(s)`);
    }
    if (warnings > 0) {
      logWarning(`Found ${warnings} warning(s)`);
    }
    
    if (errors > 0) {
      log('\n❌ Environment validation failed. Please fix the errors above.', 'red');
      return 1;
    } else {
      log('\n⚠️  Environment validation passed with warnings. Review warnings before deploying to production.', 'yellow');
      return 0;
    }
  }
}

// Run validation
const exitCode = validateEnvironment();
process.exit(exitCode);
