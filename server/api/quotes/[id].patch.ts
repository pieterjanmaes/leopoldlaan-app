import { db } from 'hub:db';

import { quoteSchema } from '../../../shared/schemas/budget';
import { idParams } from '../../../shared/schemas/common';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<QuoteView> => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => quoteSchema.partial().parse(body));

	const quote = await db.update(tables.quotes).set(body).where(eq(tables.quotes.id, id)).returning().get();
	if (!quote) {
		throw createError({ statusCode: 404, message: 'Offerte niet gevonden' });
	}

	return toQuoteView(quote);
});
