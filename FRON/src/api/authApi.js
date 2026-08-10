const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/auth`;

export const login = async (email, password) => {
	try {
		const response = await fetch(`${API_URL}/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		});
		const data = await response.json();

		if (!response.ok) {
			const errorMsg = data.message || data.error || 'Login failed';
			throw new Error(errorMsg);
		}

		// Store token in localStorage
		if (data.token) {
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.data.user));
		}

		return data;
	} catch (error) {
		throw error;
	}
};

export const signup = async (name, email, password, passwordConfirm) => {
	try {
		const response = await fetch(`${API_URL}/signup`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name, email, password, passwordConfirm }),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || 'Signup failed');
		}

		// Store token in localStorage
		if (data.token) {
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.data.user));
		}

		return data;
	} catch (error) {
		throw error;
	}
};

export const logout = async () => {
	try {
		const token = localStorage.getItem('token');
		
		await fetch(`${API_URL}/logout`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		});

		// Clear localStorage
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	} catch (error) {
		// Clear localStorage anyway even if API call fails
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	}
};

export const getMe = async () => {
	try {
		const token = localStorage.getItem('token');

		if (!token) {
			return null;
		}

		const response = await fetch(`${API_URL}/me`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || 'Failed to fetch user');
		}

		// Attempt to hydrate avatar by fetching full user record if available
		const basicUser = data?.data?.user;
		if (basicUser?.id) {
			try {
				const USERS_API_URL = API_URL.replace('/auth', '/users');
				const resp2 = await fetch(`${USERS_API_URL}/${basicUser.id}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});
				const data2 = await resp2.json();
				if (resp2.ok && data2?.data?.user) {
					return {
						...basicUser,
						avatar: data2.data.user.avatar || null,
					};
				}
			} catch (e) {
				// Fallback to basic user if users API not accessible
			}
		}
		return basicUser;
	} catch (error) {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		return null;
	}
};

export const forgotPassword = async (email) => {
	try {
		const response = await fetch(`${API_URL}/forgot-password`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email }),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || 'Forgot password request failed');
		}

		return data;
	} catch (error) {
		throw error;
	}
};

export const resetPassword = async (resetToken, password, passwordConfirm) => {
	try {
		const response = await fetch(`${API_URL}/reset-password/${resetToken}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ password, passwordConfirm }),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || 'Reset password failed');
		}

		// Store token in localStorage
		if (data.token) {
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.data.user));
		}

		return data;
	} catch (error) {
		throw error;
	}
};

export const updatePassword = async (currentPassword, newPassword, passwordConfirm) => {
	try {
		const token = localStorage.getItem('token');
		
		if (!token) {
			throw new Error('No authentication token found');
		}

		const response = await fetch(`${API_URL}/update-password`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify({ currentPassword, newPassword, passwordConfirm }),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || 'Update password failed');
		}

		// Store new token if provided
		if (data.token) {
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.data.user));
		}

		return data;
	} catch (error) {
		throw error;
	}
};

