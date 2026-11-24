import { db } from 'hub:db';

import { quoteSchema } from '../../../shared/schemas/budget';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<QuoteView> => {
	await requireInternal(event);
	const body = await readValidatedBody(event, (body) => quoteSchema.parse(body));

	return toQuoteView(await db.insert(tables.quotes).values(body).returning().get());
});
