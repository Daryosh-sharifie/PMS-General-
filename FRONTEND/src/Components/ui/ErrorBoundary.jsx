import { Component } from 'react';
import ErrorDialog from './ErrorDialog';

class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null
		};
	}

	static getDerivedStateFromError(error) {
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		this.setState({
			error,
			errorInfo
		});
	}

	handleClose = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null
		});
	};

	render() {
		if (this.state.hasError) {
			return (
				<ErrorDialog
					error={this.state.error}
					isOpen={true}
					onClose={this.handleClose}
				/>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;

