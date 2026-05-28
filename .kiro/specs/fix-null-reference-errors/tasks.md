# Implementation Plan: Fix Null Reference Errors

## Overview

This implementation plan addresses null reference errors throughout the web application by implementing null-safe property access patterns, authentication guards, and loading states. The work is organized by page component, with each component being updated to handle null user states gracefully.

## Tasks

- [ ] 1. Create shared utilities and constants
  - Create a constants file with fallback values for user properties
  - Create a reusable LoadingState component
  - Create a custom hook for authentication guard logic (optional)
  - _Requirements: 4.1, 4.2, 4.3, 3.3_

- [ ]* 1.1 Write unit tests for fallback constants
  - Test that fallback values are defined and have correct types
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 2. Fix chat page (web/src/app/chat/page.tsx)
  - [ ] 2.1 Add loading state management
    - Add isLoading state that checks initialized flag
    - Display LoadingState component while initializing
    - _Requirements: 2.4, 3.1, 3.3, 3.4_
  
  - [ ] 2.2 Implement authentication guard
    - Add useEffect that redirects to /login when initialized is true and user is null
    - Ensure redirect doesn't happen during initialization
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 2.3 Update all user property accesses to use optional chaining
    - Replace `user.id` with `user?.id || ''`
    - Replace `user.fullname` with `user?.fullname || 'User'`
    - Replace `user.email` with `user?.email || ''`
    - Replace `user.role` with `user?.role || 'USER'`
    - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 2.4 Update socket connection logic
    - Add null check before establishing socket connection
    - Use optional chaining in socket.emit calls for user properties
    - Provide fallback values in socket events
    - _Requirements: 5.1, 5.3, 5.4_
  
  - [ ]* 2.5 Write unit tests for chat page
    - **Example Test 1: Null User Renders Without Errors**
    - **Validates: Requirements 1.2, 6.2, 6.4**
    - **Example Test 2: Fallback Values Display Correctly**
    - **Validates: Requirements 1.3, 4.1, 4.2, 4.3**
    - **Example Test 3: Authentication Redirect After Initialization**
    - **Validates: Requirements 2.1**
    - **Example Test 4: No Redirect During Initialization**
    - **Validates: Requirements 2.2, 2.4, 3.1**
    - **Example Test 9: Socket Connection Requires User**
    - **Validates: Requirements 5.1, 5.3**

- [ ] 3. Fix dashboard page (web/src/app/dashboard/page.tsx)
  - [ ] 3.1 Add loading state management
    - Add isLoading state that checks initialized flag
    - Display LoadingState component while initializing
    - _Requirements: 2.4, 3.1, 3.3, 3.4_
  
  - [ ] 3.2 Implement authentication guard
    - Add useEffect that redirects to /login when initialized is true and user is null
    - Update existing canAccessDashboard check to wait for initialization
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 3.3 Update all user property accesses to use optional chaining
    - Replace `user.fullname` with `user?.fullname || 'User'` in firstName calculation
    - Ensure all user property accesses are null-safe
    - _Requirements: 1.2, 1.3, 4.1, 4.4_
  
  - [ ]* 3.4 Write unit tests for dashboard page
    - **Example Test 1: Null User Renders Without Errors**
    - **Validates: Requirements 1.2, 6.2, 6.4**
    - **Example Test 2: Fallback Values Display Correctly**
    - **Validates: Requirements 1.3, 4.1**
    - **Example Test 3: Authentication Redirect After Initialization**
    - **Validates: Requirements 2.1**

- [ ] 4. Fix teams page (web/src/app/teams/page.tsx)
  - [ ] 4.1 Add loading state management
    - Update existing isLoading to also check initialized flag
    - Display LoadingState component while initializing
    - _Requirements: 2.4, 3.1, 3.3, 3.4_
  
  - [ ] 4.2 Implement authentication guard
    - Add useEffect that redirects to /login when initialized is true and user is null
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 4.3 Update all user property accesses to use optional chaining
    - Ensure user?.role checks are null-safe in isAdmin calls
    - Add fallback values where user properties are displayed
    - _Requirements: 1.2, 1.3, 4.1, 4.4_
  
  - [ ]* 4.4 Write unit tests for teams page
    - **Example Test 1: Null User Renders Without Errors**
    - **Validates: Requirements 1.2, 6.2, 6.4**
    - **Example Test 3: Authentication Redirect After Initialization**
    - **Validates: Requirements 2.1**

- [ ] 5. Fix workspace page (web/src/app/workspace/page.tsx)
  - [ ] 5.1 Add loading state management
    - Update existing isLoading to also check initialized flag
    - Display LoadingState component while initializing
    - _Requirements: 2.4, 3.1, 3.3, 3.4_
  
  - [ ] 5.2 Implement authentication guard
    - Add useEffect that redirects to /login when initialized is true and user is null
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 5.3 Update firstName calculation to use optional chaining
    - Replace `user?.fullname?.split` with proper null handling
    - Ensure fallback value is used when fullname is null
    - _Requirements: 1.2, 1.3, 4.1, 4.4_
  
  - [ ]* 5.4 Write unit tests for workspace page
    - **Example Test 1: Null User Renders Without Errors**
    - **Validates: Requirements 1.2, 6.2, 6.4**
    - **Example Test 2: Fallback Values Display Correctly**
    - **Validates: Requirements 1.3, 4.1**
    - **Example Test 3: Authentication Redirect After Initialization**
    - **Validates: Requirements 2.1**

- [ ] 6. Checkpoint - Verify all pages work correctly
  - Test each page manually with null user state
  - Verify no console errors appear
  - Verify loading states display correctly
  - Verify redirects work as expected
  - Ensure all tests pass, ask the user if questions arise

- [ ] 7. Update any remaining components that access user object
  - Search for any other files that access user from useStore
  - Apply the same null-safety patterns
  - _Requirements: 1.2, 6.2, 6.4_

- [ ]* 7.1 Write integration tests
  - Test full authentication flow from login to page access
  - Test session expiration and logout scenarios
  - _Requirements: 2.3, 6.4_

- [ ] 8. Final verification and cleanup
  - Run TypeScript compiler to verify no type errors
  - Run all tests to ensure they pass
  - Manually test all affected pages
  - Verify no "Cannot read properties of null" errors in console
  - _Requirements: 7.4, 6.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster implementation
- Each page follows the same pattern: loading state → authentication guard → null-safe property access
- The chat page requires special attention for socket connection safety
- All user property accesses should use optional chaining with appropriate fallback values
- The `initialized` flag from the store is critical for distinguishing between "loading" and "not authenticated" states
