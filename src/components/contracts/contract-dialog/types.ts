import { Tour, ContractTemplate } from '@/types/tour.types'

export interface ContractDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
  mode: 'create' | 'edit'
}

export interface ContractData {
  reviewYear: string
  reviewMonth: string
  reviewDay: string
  travelerName: string
  travelerAddress: string
  travelerIdNumber: string
  travelerPhone: string
  tourName: string
  tourDestination: string
  tourCode: string
  gatherYear: string
  gatherMonth: string
  gatherDay: string
  gatherHour: string
  gatherMinute: string
  gatherLocation: string
  totalAmount: string
  depositAmount: string
  deathInsurance: string
  medicalInsurance: string
  companyExtension: string
}

export interface ContractTemplate {
  value: ContractTemplate
  label: string
}
