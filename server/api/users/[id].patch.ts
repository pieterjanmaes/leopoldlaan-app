import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { userUpdateSchema } from '../../../shared/schemas/users';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<UserView> => {
	const owner = await requireOwner(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => userUpdateSchema.parse(body));

	if (id === owner.id && body.role && body.role !== 'owner') {
		throw createError({ statusCode: 400, message: 'Je kan je eigen rol niet verlagen' });
	}

	const user = await db.update(tables.users).set(body).where(eq(tables.users.id, id)).returning().get();
	if (!user) {
		throw createError({ statusCode: 404, message: 'Gebruiker niet gevonden' });
	}

	return toUserView(user);
});
