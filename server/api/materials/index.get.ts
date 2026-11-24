export default defineEventHandler(async (event): Promise<MaterialView[]> => {
	await requireInternal(event);

	return await listMaterials();
});
