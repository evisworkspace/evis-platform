# React Query Patterns & Best Practices

## Overview

React Query (TanStack Query) enables intelligent caching and synchronization of server state. This guide covers essential patterns for maintaining cache consistency and optimizing data fetching.

---

## 1. Query Cache Configuration

### Default Settings
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000,          // 10 minutes - garbage collection time
      retry: 2,                        // Retry failed requests twice
      refetchOnWindowFocus: false,     // Prevent unwanted refetches
    },
  },
});
```

### Stale Time vs GC Time
- **staleTime**: How long data is considered "fresh" without refetch
- **gcTime** (formerly `cacheTime`): How long unused cache is kept in memory
- **Rule**: `staleTime < gcTime` to maintain cache efficiency

---

## 2. Query Key Structure

### Hierarchical Keys
Organize keys by resource and filters:

```typescript
// Simple resource
['servicos']                              // All services

// With resource ID
['servicos', obraId]                      // Services for specific work

// With multiple filters
['diario_obra', obraId, date]             // Diary for work + date

// With nested data
['equipes', obraId, 'presenca']           // Nested resources
```

### Benefits
- Automatic scope management for cache invalidation
- Enables granular invalidation patterns
- Improves debugging with clear cache structure

---

## 3. Cache Invalidation Patterns

### Invalidate Specific Query
```typescript
queryClient.invalidateQueries({
  queryKey: ['servicos', obraId],
});
```

### Invalidate Multiple Related Queries
```typescript
queryClient.invalidateQueries({
  queryKey: ['servicos'],  // Matches all ['servicos', ...] keys
});
```

### Invalidate on Mutation Success
```typescript
useMutation({
  mutationFn: (data) => syncToSupabase(data),
  onSuccess: () => {
    // Refetch affected queries
    queryClient.invalidateQueries({ queryKey: ['servicos'] });
    queryClient.invalidateQueries({ queryKey: ['diario_obra'] });
  },
});
```

---

## 4. Async State Management

### States During Query Lifecycle
```typescript
const { 
  data,           // Current cached data
  isLoading,      // First load in progress
  isFetching,     // Any fetch in progress (including background)
  isError,        // Error occurred
  error,          // Error object
  refetch,        // Manual refetch function
} = useSupabaseQuery(queryKey, path, config);
```

### Loading State Handling
```typescript
if (isLoading) return <div>Loading...</div>;
if (isError) return <div>Error: {error.message}</div>;
return <div>{/* Render data */}</div>;
```

---

## 5. Background Refetch Strategy

### When Data Refetches Automatically
1. **After staleTime**: If marked stale, background refetch on access
2. **On Window Focus**: If `refetchOnWindowFocus` is enabled
3. **On Network Reconnect**: Automatic retry when coming online
4. **On Manual Refetch**: User or code calls `refetch()`

### User Experience Pattern
```typescript
// Show stale data immediately while refetching in background
{isFetching && <span> (updating...)</span>}
{data && <div>{/* Show cached data */}</div>}
```

---

## 6. useSupabaseQuery Hook

### Implementation
```typescript
export function useSupabaseQuery<T = any>(
  key: string | string[],
  path: string,
  config: Config,
  options?: UseQueryOptions<T, Error>
) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      // Fetch with error logging
      const response = await fetch(`/api/query?path=${path}`);
      if (!response.ok) throw new Error('Fetch failed');
      return response.json();
    },
    ...options,
  });
}
```

### Usage
```typescript
const { data, isLoading } = useSupabaseQuery(
  ['servicos', obraId],
  `servicos?obra_id=eq.${obraId}`,
  config,
  { staleTime: 2 * 60 * 1000 }  // Override default
);
```

---

## 7. Mutation with Cache Sync

### Pattern for Data Updates
```typescript
const queryClient = useQueryClient();

const { mutate: updateService } = useMutation({
  mutationFn: (updates) => api.updateServicos(updates),
  
  // Success: Invalidate cache to refetch
  onSuccess: (result) => {
    queryClient.invalidateQueries({ 
      queryKey: ['servicos', obraId] 
    });
    toast('Saved successfully', 'success');
  },
  
  // Error: Handle gracefully
  onError: (error) => {
    toast(`Error: ${error.message}`, 'error');
  },
});
```

---

## 8. Preventing N+1 Query Problem

### ❌ Anti-Pattern
```typescript
// Fetches on EVERY tab switch
const { data } = useSupabaseQuery(...);  // N+1 if no cache
```

### ✅ Pattern with React Query
```typescript
// Cache + staleTime ensures single fetch per 5 minutes
const { data } = useSupabaseQuery(
  ['servicos', obraId],
  path,
  config,
  { staleTime: 5 * 60 * 1000 }
);
```

---

## 9. Error Handling & Retry Logic

### Automatic Retry
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Retry on network error, not on 4xx/5xx
        return failureCount < 2 && error.status !== 401;
      },
    },
  },
});
```

### Manual Error Handling
```typescript
const { data, error } = useSupabaseQuery(...);

if (error?.status === 401) {
  return <UnauthorizedMessage />;
}
if (error?.status === 404) {
  return <NotFoundMessage />;
}
```

---

## 10. Optimistic Updates

### Pattern for Immediate UI Response
```typescript
const { mutate } = useMutation({
  mutationFn: updateData,
  
  onMutate: async (newData) => {
    // Cancel ongoing refetches
    await queryClient.cancelQueries({ queryKey: ['data'] });
    
    // Update UI immediately
    const previous = queryClient.getQueryData(['data']);
    queryClient.setQueryData(['data'], newData);
    
    return { previous };  // For rollback
  },
  
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['data'], context.previous);
  },
  
  onSuccess: () => {
    // Confirm with server data
    queryClient.invalidateQueries({ queryKey: ['data'] });
  },
});
```

---

## Key Takeaways

1. **Cache First**: Let React Query manage server state
2. **Smart Invalidation**: Only refetch affected queries
3. **Stale Time**: Prevents unnecessary refetches while keeping data fresh
4. **Error Retry**: Automatic retry logic for resilience
5. **Background Sync**: Keep data fresh without blocking UI
6. **Type Safety**: Use generic hooks for reusability

---

## References

- [React Query Documentation](https://tanstack.com/query/latest)
- [Query Key Best Practices](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [Caching Strategies](https://tanstack.com/query/latest/docs/react/guides/caching)
