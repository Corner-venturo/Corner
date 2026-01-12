'use client'

import { QuickAddForm } from './quick-add/QuickAddForm'
import { QuickAddPreview } from './quick-add/QuickAddPreview'
import { useQuickAdd } from './quick-add/hooks/useQuickAdd'
import { createCustomer } from '@/data'

interface MemberQuickAddProps {
  orderId: string
  departureDate: string
  onMembersAdded?: () => void
}

export function MemberQuickAdd({ orderId, departureDate, onMembersAdded }: MemberQuickAddProps) {
  const {
    mode,
    setMode,
    passportFiles,
    setPassportFiles,
    isUploading,
    selectedCustomer,
    setSelectedCustomer,
    availableCustomers,
    handleUploadPassports,
    handleSelectCustomer,
    showConfirmDialog,
    setShowConfirmDialog,
    pendingMember,
    setPendingMember,
    matchedCustomers,
    addMemberAndCustomer,
  } = useQuickAdd(orderId, onMembersAdded)

  const handleCreateNew = async () => {
    if (!pendingMember) return

    const newCustomer = await createCustomer({
      name: pendingMember.name,
      passport_number: pendingMember.passport_number,
      passport_romanization: pendingMember.name_en,
      passport_expiry_date: pendingMember.passport_expiry,
      national_id: pendingMember.id_number,
      date_of_birth: pendingMember.birthday,
      gender: pendingMember.gender,
      email: '',
      phone: '',
    } as unknown as Parameters<typeof createCustomer>[0])

    if (newCustomer?.id) {
      await addMemberAndCustomer(pendingMember, newCustomer.id)
    }
    setShowConfirmDialog(false)
    setPendingMember(null)
  }

  const handleSelectExisting = async (customerId: string) => {
    if (!pendingMember) return

    await addMemberAndCustomer(pendingMember, customerId)
    setShowConfirmDialog(false)
    setPendingMember(null)
  }

  return (
    <>
      <QuickAddForm
        orderId={orderId}
        mode={mode}
        onModeChange={setMode}
        passportFiles={passportFiles}
        onPassportFilesChange={setPassportFiles}
        isUploading={isUploading}
        onUploadPassports={handleUploadPassports}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
        availableCustomers={availableCustomers}
        onSelectCustomerSubmit={handleSelectCustomer}
        onImportComplete={onMembersAdded}
      />

      <QuickAddPreview
        show={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false)
          setPendingMember(null)
        }}
        pendingMember={pendingMember}
        matchedCustomers={matchedCustomers}
        onSelectExisting={handleSelectExisting}
        onCreateNew={handleCreateNew}
      />
    </>
  )
}
