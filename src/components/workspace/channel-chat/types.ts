export interface ChannelChatProps {
  // Future props if needed
}

export interface ChannelChatState {
  messageText: string
  showMemberSidebar: boolean
  isSwitching: boolean
  showShareQuoteDialog: boolean
  showShareTourDialog: boolean
  showNewPaymentDialog: boolean
  showNewReceiptDialog: boolean
  showNewTaskDialog: boolean
  showShareAdvanceDialog: boolean
  showShareOrdersDialog: boolean
  showCreateReceiptDialog: boolean
  showCreatePaymentDialog: boolean
  selectedOrder: unknown
  selectedAdvanceItem: unknown
  selectedAdvanceListId: string
  showSettingsDialog: boolean
  editChannelName: string
  editChannelDescription: string
}

export interface DialogState {
  showShareQuoteDialog: boolean
  showShareTourDialog: boolean
  showNewPaymentDialog: boolean
  showNewReceiptDialog: boolean
  showNewTaskDialog: boolean
  showShareAdvanceDialog: boolean
  showShareOrdersDialog: boolean
  showCreateReceiptDialog: boolean
  showCreatePaymentDialog: boolean
  showSettingsDialog: boolean
}

export interface SelectedState {
  selectedOrder: unknown
  selectedAdvanceItem: unknown
  selectedAdvanceListId: string
}
