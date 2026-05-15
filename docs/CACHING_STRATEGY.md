# Caching Strategy — MyProdusen

## Overview

MyProdusen uses Redis-based distributed caching to optimize performance and reduce database load. The caching layer is designed to handle high concurrency while maintaining data consistency.

## Architecture

### Components

- **Redis Client** (`lib/cache/redis.ts`) - Connection pooling and error handling
- **Cache Manager** (`lib/cache/cache-manager.ts`) - Abstraction layer for cache operations
- **Cache Keys** (`lib/cache/cache-keys.ts`) - Centralized key management
- **Cache Strategies** (`lib/cache/cache-strategies.ts`) - TTL configurations
- **Cache Warmer** (`lib/cache/cache-warmer.ts`) - Preload critical data
- **Cache Metrics** (`lib/cache/cache-metrics.ts`) - Performance monitoring

### Cache Patterns

1. **Cache-Aside (Lazy Loading)**
   - Read: Check cache → Miss → Fetch from DB → Store in cache
   - Used for: Employee details, work locations, shifts

2. **Write-Through**
   - Write: Update DB → Update cache
   - Used for: Critical configuration data

3. **Cache Invalidation**
   - On mutation: Invalidate related cache keys
   - Tag-based invalidation for bulk operations

## Cache Layers

### Employee Cache

**Keys:**
- `employees:list:role:{role}:team:{teamId}` - Employee list by filters
- `employees:detail:{id}` - Employee detail with relations
- `employees:count` - Total employee count

**TTL:** 5 minutes (MEDIUM)

**Invalidation:**
- On create/update/delete employee
- Pattern: `employees:*`

### Attendance Cache

**Keys:**
- `attendance:today:{employeeId}` - Today's attendance record
- `attendance:today:all` - All today's attendance
- `attendance:list:date:{date}:emp:{employeeId}` - Attendance list
- `attendance:stats:{date}` - Daily statistics

**TTL:** 1 minute (SHORT) for today, 5 minutes (MEDIUM) for historical

**Invalidation:**
- On check-in/check-out
- On manual adjustment
- Pattern: `attendance:*`

### Work Location Cache

**Keys:**
- `work-locations:active` - Active locations only
- `work-locations:list` - All locations
- `work-locations:detail:{id}` - Location detail

**TTL:** 30 minutes (LONG)

**Invalidation:**
- On create/update/delete location
- Pattern: `work-locations:*`

### Shift Cache

**Keys:**
- `shifts:active` - Active shifts only
- `shifts:list` - All shifts
- `shifts:detail:{id}` - Shift detail

**TTL:** 30 minutes (LONG)

**Invalidation:**
- On create/update/delete shift
- Pattern: `shifts:*`

### Leave Request Cache

**Keys:**
- `leave:pending:supervisor:{supervisorId}` - Pending leaves by supervisor
- `leave:list:emp:{employeeId}:status:{status}` - Leave list
- `leave:detail:{id}` - Leave detail

**TTL:** 5 minutes (MEDIUM)

**Invalidation:**
- On create/approve/reject/delete
- Pattern: `leave:*`

### Dashboard Cache

**Keys:**
- `dashboard:stats:today` - Today's statistics
- `dashboard:stats:{date}` - Historical statistics
- `dashboard:charts:{period}` - Chart data

**TTL:** 2 minutes (SHORT) for stats, 5 minutes (MEDIUM) for charts

**Invalidation:**
- On attendance changes
- On employee changes

## TTL Strategy

```typescript
enum CacheTTL {
  SHORT = 60,        // 1 minute - frequently changing
  MEDIUM = 300,      // 5 minutes - moderately stable
  LONG = 1800,       // 30 minutes - stable configuration
  VERY_LONG = 3600,  // 1 hour - rarely changing
}
```

## Cache Warming

Critical caches are preloaded on application startup and refreshed periodically:

- Active work locations
- Active shifts
- Employee counts

**Schedule:** Every 5 minutes

## Cache Metrics

Tracked metrics:
- Cache hits
- Cache misses
- Hit rate percentage
- Total operations
- Error count
- Uptime

**Monitoring:** Metrics logged every 5 minutes and exposed via `/api/health`

## Configuration

### Environment Variables

```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_RETRIES=3
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
```

### Redis Configuration

- **Max Memory:** 256MB
- **Eviction Policy:** allkeys-lru (Least Recently Used)
- **Persistence:** AOF (Append-Only File)
- **Connection Pool:** Automatic retry with exponential backoff

## Best Practices

1. **Cache Only What's Needed**
   - Don't cache search queries with dynamic filters
   - Don't cache user-specific sensitive data

2. **Invalidate Aggressively**
   - Invalidate on every mutation
   - Use tag-based invalidation for related data

3. **Handle Cache Failures Gracefully**
   - Always fall back to database on cache errors
   - Log cache errors but don't fail requests

4. **Monitor Cache Performance**
   - Target: 90%+ hit rate
   - Alert on high miss rates or errors

5. **Use Appropriate TTLs**
   - Short TTL for frequently changing data
   - Long TTL for stable configuration

## Troubleshooting

### Low Hit Rate

- Check if queries are cacheable
- Verify TTL is not too short
- Check invalidation patterns

### High Memory Usage

- Reduce TTLs
- Implement more aggressive eviction
- Review cache key patterns

### Cache Stampede

- Use cache warming for critical data
- Implement request coalescing
- Add jitter to TTLs

## Performance Targets

- **Cache Hit Rate:** 90%+
- **API Response Time (cached):** <50ms
- **API Response Time (uncached):** <200ms
- **Concurrent Users:** 1000+
- **Redis Memory Usage:** <256MB

## Future Enhancements

- [ ] Cache compression for large objects
- [ ] Multi-level caching (memory + Redis)
- [ ] Cache analytics dashboard
- [ ] Automatic cache key versioning
- [ ] Distributed cache warming across instances
