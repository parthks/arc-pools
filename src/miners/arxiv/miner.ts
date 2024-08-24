import { PoolClient, PoolConfigType } from 'arcframework';

import { log } from '../../helpers/utils';

import { processArXiv } from '.';

export async function run(poolConfig: PoolConfigType) {
	const poolClient = new PoolClient({ poolConfig });

	log(`Mining ArXiv...`, 0);
	await processArXiv(poolClient);
}
