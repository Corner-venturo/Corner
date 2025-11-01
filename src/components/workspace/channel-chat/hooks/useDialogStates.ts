import { useState } from 'react';

/**
 * 管理所有對話框的開關狀態
 * 包括分享報價單、行程、付款、收據、任務、代墊、訂單等對話框
 */
export function useDialogStates() {
  const [showShareQuoteDialog, setShowShareQuoteDialog] = useState(false);
  const [showShareTourDialog, setShowShareTourDialog] = useState(false);
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false);
  const [showNewReceiptDialog, setShowNewReceiptDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showShareAdvanceDialog, setShowShareAdvanceDialog] = useState(false);
  const [showShareOrdersDialog, setShowShareOrdersDialog] = useState(false);
  const [showCreateReceiptDialog, setShowCreateReceiptDialog] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  return {
    showShareQuoteDialog,
    setShowShareQuoteDialog,
    showShareTourDialog,
    setShowShareTourDialog,
    showNewPaymentDialog,
    setShowNewPaymentDialog,
    showNewReceiptDialog,
    setShowNewReceiptDialog,
    showNewTaskDialog,
    setShowNewTaskDialog,
    showShareAdvanceDialog,
    setShowShareAdvanceDialog,
    showShareOrdersDialog,
    setShowShareOrdersDialog,
    showCreateReceiptDialog,
    setShowCreateReceiptDialog,
    showCreatePaymentDialog,
    setShowCreatePaymentDialog,
    showSettingsDialog,
    setShowSettingsDialog,
  };
}
