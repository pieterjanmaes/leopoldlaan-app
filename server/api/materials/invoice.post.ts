import { db } from 'hub:db';

import { materialInvoiceSchema } from '../../../shared/schemas/materials';
import { MATERIAL_VAT_RATE } from '../../../shared/utils/constants';
import { todayIso } from '../../../shared/utils/dates';
import { materialTotalCents } from '../../../shared/utils/materials';
import { exclVatCents } from '../../../shared/utils/vat';
import { eq, inArray, tables } from '../../utils/drizzle';

/** The one value all items share, or null when they differ. */
function common<T>(values: T[]): T | null {
	const [first] = values;

	return values.every((value) => value === first) ? (first ?? null) : null;
}

/**
 * Books selected purchases as one invoice (e.g. the receipt from the DIY store), so the budget moves them from
 * "expected" to "invoiced" without counting them twice.
 */
export default defineEventHandler(async (event): Promise<ExpenseView> => {
	await requireInternal(event);
	const body = await readValidatedBody(event, (body) => materialInvoiceSchema.parse(body));

	const items = await db.select().from(tables.materials).where(inArray(tables.materials.id, body.materialIds));
	if (items.length !== new Set(body.materialIds).size) {
		throw createError({ statusCode: 404, message: 'Een van de aankopen werd niet gevonden' });
	}
	if (items.some((item) => item.expenseId)) {
		throw createError({ statusCode: 400, message: 'Een van de aankopen staat al op een factuur' });
	}
	if (items.some((item) => item.unitPriceCents === null)) {
		throw createError({ statusCode: 400, message: 'Vul eerst een prijs in voor alle gekozen aankopen' });
	}

	const vatRate = body.vatRate ?? MATERIAL_VAT_RATE;
	const amountInclCents = items.reduce(
		(sum, item) => sum + (materialTotalCents(item.quantity, item.unitPriceCents) ?? 0),
		0
	);
	const contactId = common(items.map((item) => item.contactId));
	const supplier = contactId
		? await db
				.select({ name: tables.contacts.name })
				.from(tables.contacts)
				.where(eq(tables.contacts.id, contactId))
				.get()
		: undefined;

	const expense = await db
		.insert(tables.expenses)
		.values({
			description:
				body.description ??
				(items.length === 1
					? (items[0]?.name ?? 'Aankoop')
					: `Aankopen${supplier ? ` ${supplier.name}` : ''} (${items.length})`),
			contactId,
			categoryId: common(items.map((item) => item.categoryId)),
			roomId: common(items.map((item) => item.roomId)),
			amountExclCents: exclVatCents(amountInclCents, vatRate),
			vatRate,
			amountInclCents,
			invoiceDate: body.invoiceDate ?? todayIso('Europe/Brussels'),
			notes: items.map((item) => `${item.quantity} ${item.unit} ${item.name}`).join('\n')
		})
		.returning()
		.get();

	// On a receipt means bought: anything still on the list moves to delivered, dated like the invoice.
	const day = expense.invoiceDate ?? todayIso('Europe/Brussels');
	await db.batch(
		items.map((item) =>
			db
				.update(tables.materials)
				.set({
					expenseId: expense.id,
					status: 'delivered',
					orderedOn: item.orderedOn ?? day,
					deliveredOn: item.deliveredOn ?? day
				})
				.where(eq(tables.materials.id, item.id))
		) as [never, ...never[]]
	);

	return toExpenseView(expense);
});
