import { db } from 'hub:db';

import { isInternal } from '../../shared/utils/permissions';
import { tables, asc } from '../utils/drizzle';

export default defineEventHandler(async (event): Promise<Lookups> => {
	const user = await requireUser(event);

	const [rooms, categories, phases, contacts, users] = await Promise.all([
		db.select().from(tables.rooms).orderBy(asc(tables.rooms.sortOrder), asc(tables.rooms.name)),
		db.select().from(tables.categories).orderBy(asc(tables.categories.sortOrder), asc(tables.categories.name)),
		db.select().from(tables.phases).orderBy(asc(tables.phases.sortOrder), asc(tables.phases.startDate)),
		db.select().from(tables.contacts).orderBy(asc(tables.contacts.name)),
		db.select({ id: tables.users.id, name: tables.users.name }).from(tables.users).orderBy(asc(tables.users.name))
	]);

	// Externals get the labels they need, but not the address book of everyone else on the project.
	const visibleContacts = isInternal(user) ? contacts : contacts.filter((contact) => contact.id === user.contactId);

	return { rooms, categories, phases, contacts: visibleContacts, users };
});
