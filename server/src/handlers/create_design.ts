
import { db } from '../db';
import { designsTable } from '../db/schema';
import { type CreateDesignInput, type Design } from '../schema';

export const createDesign = async (input: CreateDesignInput): Promise<Design> => {
  try {
    // Insert design record
    const result = await db.insert(designsTable)
      .values({
        name: input.name,
        category: input.category,
        subcategory: input.subcategory || null,
        image_url: input.image_url,
        description: input.description || null,
        price_range_min: input.price_range_min ? input.price_range_min.toString() : null,
        price_range_max: input.price_range_max ? input.price_range_max.toString() : null,
        tags: input.tags || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const design = result[0];
    return {
      ...design,
      price_range_min: design.price_range_min ? parseFloat(design.price_range_min) : null,
      price_range_max: design.price_range_max ? parseFloat(design.price_range_max) : null
    };
  } catch (error) {
    console.error('Design creation failed:', error);
    throw error;
  }
};
