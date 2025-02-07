import { getUserDetails } from '$lib/common';
import * as db from '$lib/database';
import { ErrorHandler } from '$lib/database';
import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async (event) => {
	const { status, body, teamId } = await getUserDetails(event, false);
	if (status === 401) return { status, body };

	const { id } = event.params;
	try {
		const persistentStorages = await db.prisma.servicePersistentStorage.findMany({
			where: { serviceId: id }
		});
		return {
			body: {
				persistentStorages
			}
		};
	} catch (error) {
		return ErrorHandler(error);
	}
};

export const post: RequestHandler = async (event) => {
	const { teamId, status, body } = await getUserDetails(event);
	if (status === 401) return { status, body };

	const { id } = event.params;
	const { path, newStorage, storageId } = await event.request.json();
	try {
		if (newStorage) {
			await db.prisma.servicePersistentStorage.create({
				data: { path, service: { connect: { id } } }
			});
		} else {
			await db.prisma.servicePersistentStorage.update({
				where: { id: storageId },
				data: { path }
			});
		}
		return {
			status: 201
		};
	} catch (error) {
		return ErrorHandler(error);
	}
};

export const del: RequestHandler = async (event) => {
	const { teamId, status, body } = await getUserDetails(event);
	if (status === 401) return { status, body };

	const { id } = event.params;
	const { path } = await event.request.json();

	try {
		await db.prisma.servicePersistentStorage.deleteMany({ where: { serviceId: id, path } });
		return {
			status: 200
		};
	} catch (error) {
		return ErrorHandler(error);
	}
};
