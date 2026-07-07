import Swal from 'sweetalert2';

interface ConfirmOptions {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

/**
 * Shows a SweetAlert2 "Are you sure?" confirmation dialog and resolves to
 * true if the user confirmed, false if they cancelled/dismissed it.
 */
export const confirmAction = async ({
  title,
  text,
  confirmText = 'Yes',
  cancelText = 'No',
  danger = false,
}: ConfirmOptions): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: danger ? '#dc2626' : '#2563eb',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
    focusCancel: danger,
  });

  return result.isConfirmed;
};