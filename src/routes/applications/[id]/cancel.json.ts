import { asyncExecShell, getEngine, removeDestinationDocker, saveBuildLog } from '$lib/common';
import { buildQueue } from '$lib/queues';
import type { RequestHandler } from '@sveltejs/kit';
import * as db from '$lib/database';

async function cleanupDB(buildId: string) {
	const data = await db.prisma.build.findUnique({ where: { id: buildId } });
	if (data?.status === 'queued' || data?.status === 'running') {
		await db.prisma.build.update({ where: { id: buildId }, data: { status: 'failed' } });
	}
}

async function stopBuild(buildId, applicationId) {
	let count = 0;
	await new Promise<void>(async (resolve, reject) => {
		const job = await buildQueue.getJob(buildId);
		if (!job) {
			await cleanupDB(buildId);
			return resolve();
		}
		const {
			destinationDocker: { engine }
		} = job?.data;
		const host = getEngine(engine);
		let interval = setInterval(async () => {
			try {
				const data = await db.prisma.build.findUnique({ where: { id: buildId } });
				if (data?.status === 'failed') {
					clearInterval(interval);
					return resolve();
				}
				if (count > 100) {
					clearInterval(interval);
					return reject(new Error('Build canceled'));
				}

				const { stdout: buildContainers } = await asyncExecShell(
					`DOCKER_HOST=${host} docker container ls --filter "label=coolify.buildId=${buildId}" --format '{{json .}}'`
				);
				if (buildContainers) {
					const containersArray = buildContainers.trim().split('\n');
					for (const container of containersArray) {
						const containerObj = JSON.parse(container);
						const id = containerObj.ID;
						if (!containerObj.Names.startsWith(`${applicationId}`)) {
							await removeDestinationDocker({ id, engine });
							clearInterval(interval);
							await saveBuildLog({
								line: 'Canceled by user!',
								buildId: job.data.build_id,
								applicationId: job.data.id
							});
						}
					}
				}
				count++;
			} catch (error) {}
		}, 100);
	});
}
export const post: RequestHandler = async (event) => {
	const { buildId, applicationId } = await event.request.json();
	if (!buildId) {
		return {
			status: 500,
			body: {
				message: 'Build ID not found.'
			}
		};
	}
	try {
		await stopBuild(buildId, applicationId);
		return {
			status: 200,
			body: {
				message: 'Build canceled.'
			}
		};
	} catch (error) {
		return {
			status: 500,
			body: {
				message: error.message
			}
		};
	}
};
