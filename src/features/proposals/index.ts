/**
 * Proposals feature module exports
 */

// Components
export { ProposalsTableContent, ProposalDialog, PackageDialog, PackageListPanel, ArchiveProposalDialog } from './components'

// Services (re-export from services folder)
export {
  createProposal,
  updateProposal,
  archiveProposal,
  createPackage,
  updatePackage,
  duplicatePackage,
  convertToTour,
  createQuoteForPackage,
  createItineraryForPackage,
} from '@/services/proposal.service'
