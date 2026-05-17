# Offline-First & Sync Architecture

## Overview

MyProdusen implements a robust offline-first architecture that allows employees to continue working even without internet connectivity. All critical operations (attendance check-in/out, leave requests) are stored locally and automatically synced when connection is restored.

## Architecture Components

### 1. IndexedDB Storage Layer (`lib/offline/db.ts`)

Uses Dexie.js to provide a structured database in the browser:

**Tables:**
- `syncQueue` - Queue of pending sync operations
- `offlineAttendance` - Offline attendance records (check-in/out)
- `offlineLeave` - Offline leave requests
- `cachedEmployees` - Cached employee data
- `cachedLocations` - Cached work locations
- `cachedShifts` - Cached shift data
- `conflicts` - Sync conflicts requiring resolution

**Storage Limits:**
- Max queue size: 1,000 operations
- Max selfie size: 500KB (compressed)
- Max offline duration: 7 days
- Auto-cleanup after sync

### 2. Network Detector (`lib/offline/network-detector.ts`)

Monitors online/offline status:
- Listens to browser `online`/`offline` events
- Periodic connectivity checks (every 30 seconds)
- Notifies subscribers of status changes
- Triggers auto-sync when coming back online

### 3. Sync Manager (`lib/offline/sync-manager.ts`)

Orchestrates the sync process:
- Manages sync queue operations
- Processes items in batches (10 at a time)
- Implements exponential backoff retry (max 3 retries)
- Auto-syncs every 5 minutes when online
- Provides sync progress events

**Sync Flow:**
1. Operation added to queue
2. Immediate sync attempt if online
3. If offline, queued for later
4. When online, batch process queue
5. Handle conflicts and retries
6. Update local records with server IDs

### 4. Conflict Resolver (`lib/offline/conflict-resolver.ts`)

Handles sync conflicts:

**Strategies:**
- **Last-Write-Wins** - Use most recent timestamp (default for attendance)
- **Server-Wins** - Server data takes precedence (leave approvals)
- **Client-Wins** - Client data takes precedence
- **Manual** - User chooses resolution

**Conflict Detection:**
- Compare client vs server timestamps
- Detect concurrent modifications
- Store conflicts for manual resolution

### 5. Offline Services

**Attendance Service** (`features/attendance/attendance.offline.ts`)
- Check-in/out offline
- Store GPS + selfie locally
- Compress selfie images (<500KB)
- Validate GPS accuracy
- Prevent duplicate check-ins

**Leave Service** (`features/leave/leave.offline.ts`)
- Create leave requests offline
- Validate date ranges
- Calculate duration
- Queue for approval sync

## User Interface Components

### 1. Offline Indicator (`components/offline/OfflineIndicator.tsx`)
- Shows banner when offline
- Notifies when back online
- Auto-hides after 5 seconds

### 2. Sync Status (`components/offline/SyncStatus.tsx`)
- Shows pending/syncing/failed counts
- Displays sync progress bar
- Manual sync trigger
- Retry failed operations

### 3. Sync Queue (`components/offline/SyncQueue.tsx`)
- View all queued operations
- See operation status and errors
- Monitor retry attempts
- Refresh queue manually

### 4. Conflict Resolver (`components/offline/ConflictResolver.tsx`)
- View unresolved conflicts
- Compare client vs server data
- Choose resolution (client/server)
- Auto-opens when conflicts detected

## API Endpoints

### POST /api/sync/queue
Batch sync endpoint - processes multiple operations

**Request:**
```json
{
  "operations": [
    {
      "clientId": "1234-5678",
      "entity": "attendance",
      "operation": "create",
      "data": { ... }
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "clientId": "1234-5678",
      "success": true,
      "data": { "id": "att_123" }
    }
  ],
  "timestamp": 1234567890
}
```

### GET /api/sync/status
Get current sync status

**Response:**
```json
{
  "online": true,
  "lastSync": 1234567890,
  "pendingOperations": 5,
  "failedOperations": 1,
  "conflicts": 0
}
```

### GET /api/sync/conflicts
Get unresolved conflicts

### POST /api/sync/resolve
Manually resolve a conflict

## Sync Strategies

### Immediate Sync (Attendance)
- Sync as soon as online
- Critical for time-sensitive data
- Max 3 retry attempts
- Exponential backoff (1s, 2s, 4s)

### Batch Sync (Leave Requests)
- Sync in batches every 5 minutes
- Less time-sensitive
- Reduces server load

### Background Sync
- Cache refresh for employees/locations/shifts
- Runs periodically when online
- Low priority

## Data Flow

### Offline Check-In Flow
```
1. User clicks "Check In"
2. Capture GPS + selfie
3. Compress selfie (<500KB)
4. Store in offlineAttendance table
5. Add to syncQueue
6. Show "Pending Sync" status
7. When online → sync to server
8. Update with server ID
9. Mark as synced
```

### Conflict Resolution Flow
```
1. Client sends operation with timestamp
2. Server detects newer server data
3. Returns 409 Conflict with server data
4. Client stores conflict record
5. Apply resolution strategy
6. If manual → show UI for user choice
7. Retry with resolved data
```

## Storage Management

### Auto-Cleanup
- Synced records older than 7 days deleted
- Failed operations kept for manual review
- Conflicts kept until resolved

### Storage Quota
- Monitor browser storage usage
- Warn at 80% capacity
- Prevent new operations at 100%

### Selfie Compression
- Original captured at full resolution
- Compressed to max 800px width
- JPEG quality adjusted to meet 500KB limit
- Stored as data URL in IndexedDB

## Performance Targets

- **Sync Speed:** 100 operations in <5 seconds
- **IndexedDB Operations:** <10ms per operation
- **Data Loss:** 0% (100% reliability)
- **Conflict Rate:** <1%
- **Storage Usage:** <50MB per user

## Error Handling

### Network Errors
- Auto-retry with exponential backoff
- Max 3 attempts before marking failed
- User can manually retry failed operations

### Storage Errors
- Catch quota exceeded errors
- Prompt user to clear old data
- Prevent new operations if full

### Sync Errors
- Log detailed error messages
- Show user-friendly error in UI
- Allow manual conflict resolution

## Security Considerations

### Data Storage
- IndexedDB is origin-isolated
- No sensitive data in plain text
- Selfies compressed but not encrypted
- Auth tokens stored separately

### Sync Authentication
- All sync requests include Bearer token
- Token validated on server
- Expired tokens trigger re-login

### Conflict Prevention
- Client-side timestamps
- Server-side validation
- Audit log for all syncs

## Testing

### Unit Tests
- Sync queue operations
- Conflict detection logic
- Network status detection
- Storage quota management

### Integration Tests
- End-to-end sync flow
- Conflict resolution
- Offline → online transition
- Batch sync processing

### Manual Testing
1. Go offline (airplane mode)
2. Check in with GPS + selfie
3. Verify stored in IndexedDB
4. Go back online
5. Verify auto-sync
6. Check server record created

## Troubleshooting

### Sync Not Working
1. Check network status
2. Verify auth token valid
3. Check sync queue for errors
4. Review browser console logs
5. Clear and retry failed operations

### Storage Full
1. Check storage quota usage
2. Run manual cleanup
3. Clear old synced records
4. Reduce selfie quality

### Conflicts Not Resolving
1. Check conflict resolver UI
2. Verify resolution strategy
3. Manually resolve if needed
4. Check server timestamps

## Future Enhancements

1. **Background Sync API** - Use native browser background sync
2. **Service Worker** - Full PWA support with offline caching
3. **Differential Sync** - Only sync changed fields
4. **Compression** - Compress sync payloads
5. **Encryption** - Encrypt sensitive offline data
6. **Face Matching** - Validate selfie against profile photo
7. **GPS Anti-Spoofing** - Detect fake GPS locations

## Migration Guide

### Enabling Offline Mode
1. Install dependencies: `npm install dexie dexie-react-hooks`
2. Import offline components in layout
3. Initialize IndexedDB on app load
4. Update attendance/leave forms to use offline services

### Disabling Offline Mode
1. Remove offline components from layout
2. Revert to direct API calls
3. Clear IndexedDB data
4. Remove offline dependencies

## Monitoring

### Metrics to Track
- Sync success rate
- Average sync time
- Conflict rate
- Storage usage per user
- Failed operation count
- Offline duration

### Alerts
- Sync failure rate >5%
- Conflict rate >1%
- Storage usage >80%
- Failed operations >10

## Support

For issues or questions:
1. Check browser console for errors
2. Review sync queue status
3. Check network connectivity
4. Contact system administrator
