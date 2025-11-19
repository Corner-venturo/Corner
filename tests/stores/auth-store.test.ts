import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { User } from '@/stores/types'

// Mock dependencies
vi.mock('@/stores/user-store', () => ({
  useUserStore: {
    getState: () => ({
      items: [],
    }),
  },
}))

vi.mock('@/lib/auth', () => ({
  generateToken: vi.fn((payload) => 'mock-token'),
}))

vi.mock('@/lib/auth/local-auth-manager', () => ({
  useLocalAuthStore: {
    getState: () => ({
      profiles: [],
    }),
  },
}))

vi.mock('@/services/offline-auth.service', () => ({
  OfflineAuthService: {
    validateLogin: vi.fn(),
    logout: vi.fn(),
  },
}))

describe('AuthStore', () => {
  beforeEach(async () => {
    // Reset store state before each test
    const store = useAuthStore.getState()
    await store.logout()
    // Ensure currentProfile is cleared
    useAuthStore.setState({ currentProfile: null, user: null, isAuthenticated: false })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.sidebarCollapsed).toBe(true)
      expect(state.currentProfile).toBeNull()
      expect(state.isOfflineMode).toBe(false)
    })
  })

  describe('Login', () => {
    it('should login user and set authenticated state', () => {
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['view_orders', 'edit_orders'],
        workspace_id: 'workspace-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const store = useAuthStore.getState()
      store.login(mockUser)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
    })
  })

  describe('Logout', () => {
    it('should clear user data and set unauthenticated', async () => {
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['view_orders'],
        workspace_id: 'workspace-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const store = useAuthStore.getState()
      store.login(mockUser)
      await store.logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('Permissions', () => {
    it('should check user permissions correctly', () => {
      const mockProfile = {
        id: '1',
        employee_number: 'EMP001',
        display_name: 'Test User',
        permissions: ['view_orders', 'edit_orders', 'delete_orders'],
      }

      const store = useAuthStore.getState()
      // Set currentProfile directly for testing
      store.login({
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['view_orders', 'edit_orders', 'delete_orders'],
        workspace_id: 'workspace-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Manually set currentProfile for this test
      useAuthStore.setState({ currentProfile: mockProfile as any })

      expect(store.checkPermission('view_orders')).toBe(true)
      expect(store.checkPermission('edit_orders')).toBe(true)
      expect(store.checkPermission('non_existent_permission')).toBe(false)
    })

    it('should return false when user is not logged in', () => {
      const store = useAuthStore.getState()
      expect(store.checkPermission('view_orders')).toBe(false)
    })
  })

  describe('Sidebar', () => {
    it('should toggle sidebar collapsed state', () => {
      const store = useAuthStore.getState()
      const initialState = store.sidebarCollapsed

      store.toggleSidebar()
      expect(useAuthStore.getState().sidebarCollapsed).toBe(!initialState)

      store.toggleSidebar()
      expect(useAuthStore.getState().sidebarCollapsed).toBe(initialState)
    })

    it('should set sidebar collapsed state directly', () => {
      const store = useAuthStore.getState()

      store.setSidebarCollapsed(false)
      expect(useAuthStore.getState().sidebarCollapsed).toBe(false)

      store.setSidebarCollapsed(true)
      expect(useAuthStore.getState().sidebarCollapsed).toBe(true)
    })
  })
})
