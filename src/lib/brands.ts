import { db } from './db'
export async function getBrandById(id: string) { return db.brand.findUnique({ where: { id } }) }
