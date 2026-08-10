import { useOutletContext } from "react-router-dom";
import UserList from "./UserList";

export default function UserManagement() {
	const context = useOutletContext() || {};

	const {
		users = [],
		onRemoveUser,
		onRefetch,
	} = context;

	return (
		<UserList
			users={users}
			onRemoveUser={onRemoveUser}
			onRefetch={onRefetch}
		/>
	);
}