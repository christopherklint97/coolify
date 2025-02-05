import { getUserDetails, removeDestinationDocker } from '$lib/common';
import * as db from '$lib/database';
import { ErrorHandler } from '$lib/database';
import { checkContainer, stopTcpHttpProxy } from '$lib/haproxy';
import type { RequestHandler } from '@sveltejs/kit';

export const post: RequestHandler = async (event) => {
	const { teamId, status, body } = await getUserDetails(event);
	if (status === 401) return { status, body };

	const { id } = event.params;

	try {
		const service = await db.getService({ id, teamId });
		const { destinationDockerId, destinationDocker } = service;
		if (destinationDockerId) {
			const engine = destinationDocker.engine;

			try {
				const found = await checkContainer(engine, id);
				if (found) {
					await removeDestinationDocker({ id, engine });
				}
			} catch (error) {
				console.error(error);
			}
			try {
				const found = await checkContainer(engine, `${id}-postgresql`);
				if (found) {
					await removeDestinationDocker({ id: `${id}-postgresql`, engine });
				}
			} catch (error) {
				console.error(error);
			}
		}
		return {
			status: 200
		};
	} catch (error) {
		return ErrorHandler(error);
	}
};
