
import { db } from '../db';
import { designsTable } from '../db/schema';
import { type Design } from '../schema';
import { eq } from 'drizzle-orm';

export const getDesigns = async (): Promise<Design[]> => {
  try {
    const results = await db.select()
      .from(designsTable)
      .where(eq(designsTable.is_active, true))
      .execute();

    return results.map(design => ({
      ...design,
      price_range_min: design.price_range_min ? parseFloat(design.price_range_min) : null,
      price_range_max: design.price_range_max ? parseFloat(design.price_range_max) : null
    }));
  } catch (error) {
    console.error('Get designs failed:', error);
    throw error;
  }
};
