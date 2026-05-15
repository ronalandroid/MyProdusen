# Conflict Resolution Guide

## Overview

Sync conflicts occur when the same data is modified both offline (on the client) and online (on the server) before synchronization. MyProdusen implements multiple strategies to handle these conflicts automatically and provides a UI for manual resolution when needed.

## When Conflicts Occur

### Common Scenarios

1. **Concurrent Modifications**
   - Employee modifies attendance offline
   - Admin adjusts same attendance online
   - Both changes have different timestamps

2. **Approval Status Changes**
   - Employee submits leave request offline
   - Supervisor approves/rejects online before sync
   - Client has "pending", server has "approved"

3. **Data Updates During Offline Period**
   - Employee data cached offline
   - Admin updates employee details online
   - Client syncs with stale data

## Conflict Detection

### Timestamp Comparison

```typescript
// Client sends operation with timestamp
{
  "clientId": "1234-5678",
  "timestamp": 1715770377000,
  "data": { ... }
}

// Server compares with its timestamp
serverTimestamp = 1715770380000

// If server timestamp > client timestamp
// AND data differs → CONFLICT
```

### HTTP 409 Conflict Response

```json
{
  "error": "Conflict detected",
  "serverData": { ... },
  "serverTimestamp": 1715770380000
}
```

## Resolution Strategies

### 1. Last-Write-Wins (LWW)

**Use Case:** Time-sensitive data like attendance

**Logic:**
- Compare client timestamp vs server timestamp
- Keep the most recent version
- Discard older version

**Example:**
```
Client timestamp: 08:00:00 (check-in)
Server timestamp: 08:05:00 (manual adjustment)
Result: Server wins (more recent)
```

**Pros:**
- Simple and automatic
- No user intervention needed
- Works well for time-based data

**Cons:**
- May lose valid client changes
- Not suitable for all data types

### 2. Server-Wins

**Use Case:** Approval workflows, admin changes

**Logic:**
- Always prefer server data
- Client changes are discarded
- Server is source of truth

**Example:**
```
Client: Leave status = "pending"
Server: Leave status = "approved"
Result: Server wins (approved)
```

**Pros:**
- Maintains data integrity
- Respects approval workflows
- Prevents unauthorized changes

**Cons:**
- Client changes always lost
- May frustrate users

### 3. Client-Wins

**Use Case:** User input that should override server

**Logic:**
- Always prefer client data
- Server data is discarded
- Client is source of truth

**Example:**
```
Client: Updated personal notes
Server: Old notes
Result: Client wins (new notes)
```

**Pros:**
- Respects user input
- Good for personal data

**Cons:**
- May override important server changes
- Can cause data inconsistency

### 4. Manual Resolution

**Use Case:** Critical conflicts requiring human judgment

**Logic:**
- Store conflict for review
- Show both versions to user
- User chooses which to keep

**Example:**
```
Client: Attendance at Location A
Server: Attendance at Location B
Result: User chooses correct location
```

**Pros:**
- Most accurate resolution
- User has full control
- Prevents data loss

**Cons:**
- Requires user intervention
- Slows down sync process
- May confuse non-technical users

## Entity-Specific Strategies

### Attendance
**Strategy:** Last-Write-Wins

**Rationale:**
- Time-sensitive data
- Most recent timestamp is most accurate
- Rare conflicts (employees don't modify past attendance)

**Edge Cases:**
- Manual adjustments by admin → Server wins
- Duplicate check-ins → Keep first, discard second

### Leave Requests
**Strategy:** Server-Wins

**Rationale:**
- Approval status managed by server
- Admin/supervisor changes take precedence
- Prevents re-opening approved requests

**Edge Cases:**
- Employee edits before approval → Client wins
- Employee edits after approval → Server wins

### Employee Data
**Strategy:** Server-Wins

**Rationale:**
- Admin changes are authoritative
- Cached data may be stale
- Prevents unauthorized modifications

**Edge Cases:**
- Personal notes/preferences → Client wins
- Official records → Server wins

## Manual Resolution UI

### Conflict Notification

When conflicts are detected:
1. Orange badge appears on screen
2. Shows conflict count
3. Auto-opens conflict resolver
4. Blocks further sync until resolved

### Conflict Resolver Interface

**Layout:**
```
┌─────────────────────────────────────┐
│ Sync Conflicts (2)                  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Attendance - att_123            │ │
│ │ Client: 08:00 • Server: 08:05   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───────────────┬───────────────┐   │
│ │ Your Changes  │ Server Version│   │
│ │               │               │   │
│ │ Location: A   │ Location: B   │   │
│ │ Time: 08:00   │ Time: 08:05   │   │
│ │               │               │   │
│ │ [Use Mine]    │ [Use Server]  │   │
│ └───────────────┴───────────────┘   │
└─────────────────────────────────────┘
```

### Resolution Steps

1. **Review Conflict**
   - See entity type and ID
   - Compare timestamps
   - View both data versions

2. **Choose Resolution**
   - Click "Use My Changes" for client data
   - Click "Use Server Version" for server data
   - System applies choice and retries sync

3. **Verify Result**
   - Conflict removed from list
   - Sync continues automatically
   - Data updated in local storage

## Conflict Prevention

### Best Practices

1. **Sync Frequently**
   - Auto-sync every 5 minutes
   - Manual sync before critical operations
   - Reduces conflict window

2. **Cache Wisely**
   - Refresh cache regularly
   - Mark stale data clearly
   - Warn users of outdated info

3. **Timestamp Everything**
   - Client-side timestamps on all operations
   - Server validates and compares
   - Audit trail for debugging

4. **Validate Before Sync**
   - Check data freshness
   - Verify no concurrent modifications
   - Warn user of potential conflicts

### Server-Side Prevention

```typescript
// Check for concurrent modifications
const serverRecord = await db.attendance.findById(id);
const clientTimestamp = req.headers['x-sync-timestamp'];

if (serverRecord.updatedAt > clientTimestamp) {
  // Conflict detected
  return res.status(409).json({
    error: 'Conflict',
    serverData: serverRecord,
    serverTimestamp: serverRecord.updatedAt
  });
}
```

### Client-Side Prevention

```typescript
// Warn user before modifying synced data
if (record.synced && record.serverTimestamp > record.timestamp) {
  const confirm = await showWarning(
    'This record was modified on the server. Continue?'
  );
  if (!confirm) return;
}
```

## Conflict Metrics

### Track These Metrics

1. **Conflict Rate**
   - Total conflicts / Total syncs
   - Target: <1%

2. **Resolution Time**
   - Time from detection to resolution
   - Target: <5 minutes

3. **Resolution Method**
   - Auto-resolved vs manual
   - Target: >95% auto-resolved

4. **Conflict Types**
   - By entity (attendance, leave, etc.)
   - By strategy (LWW, server-wins, etc.)

### Monitoring Dashboard

```
Conflict Statistics (Last 7 Days)
─────────────────────────────────────
Total Conflicts:        12
Auto-Resolved:          11 (92%)
Manual Resolution:       1 (8%)
Average Resolution:     2.3 minutes

By Entity:
- Attendance:           8 (67%)
- Leave:                3 (25%)
- Employee:             1 (8%)

By Strategy:
- Last-Write-Wins:      8 (67%)
- Server-Wins:          3 (25%)
- Manual:               1 (8%)
```

## Troubleshooting

### Conflict Not Auto-Resolving

**Symptoms:**
- Conflict stays in queue
- Sync keeps failing
- Error: "Resolution failed"

**Solutions:**
1. Check conflict strategy for entity
2. Verify timestamps are valid
3. Check server response format
4. Manually resolve via UI

### Too Many Conflicts

**Symptoms:**
- Conflict rate >5%
- Frequent manual resolutions needed
- User complaints

**Solutions:**
1. Increase sync frequency
2. Reduce cache duration
3. Review conflict strategies
4. Improve server validation

### Lost Data After Resolution

**Symptoms:**
- User changes disappeared
- Wrong version kept
- Data inconsistency

**Solutions:**
1. Review resolution strategy
2. Check audit logs
3. Restore from backup if needed
4. Adjust strategy for entity type

## Advanced Scenarios

### Three-Way Merge

For complex data structures, implement three-way merge:

```typescript
function threeWayMerge(base, client, server) {
  const merged = { ...base };
  
  // Apply client changes
  Object.keys(client).forEach(key => {
    if (client[key] !== base[key]) {
      merged[key] = client[key];
    }
  });
  
  // Apply non-conflicting server changes
  Object.keys(server).forEach(key => {
    if (server[key] !== base[key] && client[key] === base[key]) {
      merged[key] = server[key];
    }
  });
  
  return merged;
}
```

### Field-Level Conflicts

Instead of resolving entire records, resolve individual fields:

```typescript
{
  "conflicts": [
    {
      "field": "location",
      "clientValue": "Location A",
      "serverValue": "Location B"
    },
    {
      "field": "notes",
      "clientValue": "Updated notes",
      "serverValue": "Old notes"
    }
  ]
}
```

### Conflict Chains

Handle cascading conflicts:

```typescript
// Attendance conflict triggers leave conflict
if (attendanceConflict.resolved) {
  // Re-evaluate dependent leave request
  await checkLeaveConflict(attendanceConflict.date);
}
```

## Testing Conflicts

### Manual Testing

1. **Setup:**
   - Open app in two browsers
   - Login as same user
   - Go offline in Browser A

2. **Create Conflict:**
   - Modify data in Browser A (offline)
   - Modify same data in Browser B (online)
   - Go online in Browser A

3. **Verify:**
   - Conflict detected
   - Resolution strategy applied
   - Correct data kept

### Automated Testing

```typescript
describe('Conflict Resolution', () => {
  it('should resolve attendance conflict with LWW', async () => {
    const clientData = { time: '08:00', timestamp: 1000 };
    const serverData = { time: '08:05', timestamp: 2000 };
    
    const resolution = await conflictResolver.resolveConflict(
      clientData,
      serverData,
      'last-write-wins'
    );
    
    expect(resolution.data).toEqual(serverData);
  });
});
```

## Best Practices Summary

1. ✅ Use appropriate strategy for each entity type
2. ✅ Sync frequently to minimize conflicts
3. ✅ Provide clear UI for manual resolution
4. ✅ Log all conflicts for analysis
5. ✅ Monitor conflict rate and adjust strategies
6. ✅ Test conflict scenarios thoroughly
7. ✅ Document resolution decisions
8. ✅ Train users on conflict handling

## References

- [Offline Sync Architecture](./OFFLINE_SYNC.md)
- [API Documentation](./API.md)
- [Testing Guide](./TESTING.md)
