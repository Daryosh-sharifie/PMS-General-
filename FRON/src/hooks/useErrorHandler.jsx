import { useState, useCallback } from 'react';
import ErrorDialog from '../Components/ui/ErrorDialog';

// Global error context for managing errors across the app
export const useErrorHandler = () => {
	const [error, setError] = useState(null);
	const [isErrorOpen, setIsErrorOpen] = useState(false);

	const showError = useCallback((errorMessage) => {
		const errorObj = errorMessage instanceof Error ? errorMessage : new Error(String(errorMessage));
		setError(errorObj);
		setIsErrorOpen(true);
	}, []);

	const closeError = useCallback(() => {
		setIsErrorOpen(false);
		setError(null);
	}, []);

	return {
		error,
		isErrorOpen,
		showError,
		closeError,
		ErrorDialog: () => (
			<ErrorDialog
				error={error}
				isOpen={isErrorOpen}
				onClose={closeError}
				whatsappNumber={import.meta.env.VITE_WHATSAPP_NUMBER || '123'}
				phoneNumber={import.meta.env.VITE_PHONE_NUMBER || '+93'}
			/>
		)
	};
};

