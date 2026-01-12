import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import type { Proposal, ProposalPackage } from '@/types/proposal.types'

// Create a reusable mock chain factory
function createMockChain(resolveValue: { data: unknown; error: unknown }, isDelete = false) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
  }
  // For delete operations, eq() returns the result directly (no .single())
  // For other operations, eq() returns this for chaining
  chain.eq = isDelete
    ? vi.fn().mockResolvedValue(resolveValue)
    : vi.fn().mockReturnThis()
  return chain
}

// Global mock storage
let mockFromImplementation: Mock

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (table: string) => mockFromImplementation(table),
  },
}))

vi.mock('@/stores/utils/code-generator', () => ({
  generateProposalCode: vi.fn(() => 'P000001'),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Import after mocking
import {
  createProposal,
  updateProposal,
  archiveProposal,
  getProposalWithPackages,
  createPackage,
  updatePackage,
  deletePackage,
} from '@/services/proposal.service'

describe('ProposalService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFromImplementation = vi.fn()
  })

  // ============================================
  // createProposal
  // ============================================
  describe('createProposal', () => {
    const mockProposalData = {
      title: '日本東京5日遊',
      customer_name: '張三',
      destination: '東京',
    }

    it('should create a proposal with generated code', async () => {
      const mockCreatedProposal: Partial<Proposal> = {
        id: 'proposal-1',
        code: 'P000001',
        title: '日本東京5日遊',
        status: 'draft',
        workspace_id: 'workspace-1',
      }

      // Setup mock: first call gets existing proposals, second call inserts
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // Get existing proposals for code generation
          return createMockChain({ data: [], error: null })
        }
        // Insert new proposal
        return createMockChain({ data: mockCreatedProposal, error: null })
      })

      const result = await createProposal(mockProposalData, 'workspace-1', 'user-1')

      expect(result).toEqual(mockCreatedProposal)
      expect(mockFromImplementation).toHaveBeenCalledWith('proposals')
    })

    it('should throw error when insert fails', async () => {
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return createMockChain({ data: [], error: null })
        }
        return createMockChain({ data: null, error: { message: '資料庫錯誤' } })
      })

      await expect(createProposal(mockProposalData, 'workspace-1', 'user-1'))
        .rejects.toThrow('建立提案失敗: 資料庫錯誤')
    })
  })

  // ============================================
  // updateProposal
  // ============================================
  describe('updateProposal', () => {
    it('should update a proposal successfully', async () => {
      const mockUpdatedProposal: Partial<Proposal> = {
        id: 'proposal-1',
        code: 'P000001',
        title: '日本東京6日遊',
        status: 'negotiating',
      }

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockUpdatedProposal, error: null })
      )

      const result = await updateProposal(
        'proposal-1',
        { title: '日本東京6日遊', status: 'negotiating' },
        'user-1'
      )

      expect(result).toEqual(mockUpdatedProposal)
    })

    it('should throw error when update fails', async () => {
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: null, error: { message: '更新失敗' } })
      )

      await expect(updateProposal('proposal-1', { title: '新標題' }, 'user-1'))
        .rejects.toThrow('更新提案失敗: 更新失敗')
    })
  })

  // ============================================
  // archiveProposal
  // ============================================
  describe('archiveProposal', () => {
    it('should archive a proposal with reason', async () => {
      const mockArchivedProposal: Partial<Proposal> = {
        id: 'proposal-1',
        status: 'archived',
        archive_reason: 'not_interested',
      }

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockArchivedProposal, error: null })
      )

      const result = await archiveProposal('proposal-1', 'not_interested', 'user-1')

      expect(result.status).toBe('archived')
    })

    it('should throw error when archive fails', async () => {
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: null, error: { message: '封存失敗' } })
      )

      await expect(archiveProposal('proposal-1', 'other', 'user-1'))
        .rejects.toThrow('封存提案失敗: 封存失敗')
    })
  })

  // ============================================
  // getProposalWithPackages
  // ============================================
  describe('getProposalWithPackages', () => {
    it('should return proposal with packages', async () => {
      const mockProposal: Partial<Proposal> = {
        id: 'proposal-1',
        code: 'P000001',
        title: '日本東京5日遊',
        packages: [{ id: 'pkg-1', version_name: '方案A' } as ProposalPackage],
      }

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockProposal, error: null })
      )

      const result = await getProposalWithPackages('proposal-1')

      expect(result).toEqual(mockProposal)
    })

    it('should return null when proposal not found', async () => {
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: null, error: { message: 'Not found' } })
      )

      const result = await getProposalWithPackages('non-existent')

      expect(result).toBeNull()
    })
  })

  // ============================================
  // createPackage
  // ============================================
  describe('createPackage', () => {
    const mockPackageData = {
      proposal_id: 'proposal-1',
      version_name: '方案A - 標準版',
      destination: '東京',
      days: 5,
      nights: 4,
    }

    it('should create a package with version number', async () => {
      const mockCreatedPackage: Partial<ProposalPackage> = {
        id: 'pkg-1',
        proposal_id: 'proposal-1',
        version_name: '方案A - 標準版',
        version_number: 1,
      }

      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // Get existing packages for version number
          return createMockChain({ data: [], error: null })
        }
        // Insert new package
        return createMockChain({ data: mockCreatedPackage, error: null })
      })

      const result = await createPackage(mockPackageData, 'user-1')

      expect(result).toEqual(mockCreatedPackage)
    })

    it('should throw error when insert fails', async () => {
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return createMockChain({ data: [], error: null })
        }
        return createMockChain({ data: null, error: { message: '建立失敗' } })
      })

      await expect(createPackage(mockPackageData, 'user-1'))
        .rejects.toThrow('建立套件失敗: 建立失敗')
    })
  })

  // ============================================
  // updatePackage
  // ============================================
  describe('updatePackage', () => {
    it('should update a package successfully', async () => {
      const mockUpdatedPackage: Partial<ProposalPackage> = {
        id: 'pkg-1',
        version_name: '方案A - 豪華版',
        is_selected: true,
      }

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockUpdatedPackage, error: null })
      )

      const result = await updatePackage(
        'pkg-1',
        { version_name: '方案A - 豪華版', is_selected: true },
        'user-1'
      )

      expect(result).toEqual(mockUpdatedPackage)
    })

    it('should throw error when update fails', async () => {
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: null, error: { message: '更新失敗' } })
      )

      await expect(updatePackage('pkg-1', { version_name: '新名稱' }, 'user-1'))
        .rejects.toThrow('更新套件失敗: 更新失敗')
    })
  })

  // ============================================
  // deletePackage
  // ============================================
  describe('deletePackage', () => {
    it('should delete package and related data', async () => {
      // All delete operations succeed (use isDelete=true for delete chains)
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: null, error: null }, true)
      )

      await expect(deletePackage('pkg-1')).resolves.not.toThrow()
    })

    it('should throw error when delete fails', async () => {
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        // First two calls (delete quotes, delete itineraries) succeed
        if (callCount <= 2) {
          return createMockChain({ data: null, error: null }, true)
        }
        // Third call (delete package) fails
        return createMockChain({ data: null, error: { message: '刪除失敗' } }, true)
      })

      await expect(deletePackage('pkg-1'))
        .rejects.toThrow('刪除套件失敗: 刪除失敗')
    })
  })
})
