
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { designsTable } from '../db/schema';
import { type CreateDesignInput } from '../schema';
import { getDesigns } from '../handlers/get_designs';

const testDesign1: CreateDesignInput = {
  name: 'Elegant Wedding Card',
  category: 'Wedding',
  subcategory: 'Traditional',
  image_url: 'https://example.com/wedding1.jpg',
  description: 'Beautiful traditional wedding invitation',
  price_range_min: 50.00,
  price_range_max: 100.00,
  tags: '["wedding", "traditional", "elegant"]'
};

const testDesign2: CreateDesignInput = {
  name: 'Modern Business Card',
  category: 'Business',
  subcategory: 'Corporate',
  image_url: 'https://example.com/business1.jpg',
  description: 'Sleek modern business card design',
  price_range_min: 25.00,
  price_range_max: 50.00,
  tags: '["business", "modern", "corporate"]'
};

const testDesign3: CreateDesignInput = {
  name: 'Birthday Party Invitation',
  category: 'Birthday',
  subcategory: null,
  image_url: 'https://example.com/birthday1.jpg',
  description: 'Fun birthday party invitation',
  price_range_min: null,
  price_range_max: null,
  tags: '["birthday", "party", "colorful"]'
};

describe('getDesigns', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no designs exist', async () => {
    const result = await getDesigns();
    expect(result).toEqual([]);
  });

  it('should return all active designs', async () => {
    // Create test designs
    await db.insert(designsTable).values([
      {
        ...testDesign1,
        price_range_min: testDesign1.price_range_min?.toString(),
        price_range_max: testDesign1.price_range_max?.toString()
      },
      {
        ...testDesign2,
        price_range_min: testDesign2.price_range_min?.toString(),
        price_range_max: testDesign2.price_range_max?.toString()
      },
      {
        ...testDesign3,
        price_range_min: testDesign3.price_range_min?.toString(),
        price_range_max: testDesign3.price_range_max?.toString()
      }
    ]).execute();

    const result = await getDesigns();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Elegant Wedding Card');
    expect(result[0].category).toBe('Wedding');
    expect(result[0].subcategory).toBe('Traditional');
    expect(result[0].price_range_min).toBe(50.00);
    expect(result[0].price_range_max).toBe(100.00);
    expect(typeof result[0].price_range_min).toBe('number');
    expect(typeof result[0].price_range_max).toBe('number');

    expect(result[1].name).toBe('Modern Business Card');
    expect(result[1].category).toBe('Business');

    expect(result[2].name).toBe('Birthday Party Invitation');
    expect(result[2].price_range_min).toBeNull();
    expect(result[2].price_range_max).toBeNull();
  });

  it('should exclude inactive designs', async () => {
    // Create active design
    await db.insert(designsTable).values({
      ...testDesign1,
      price_range_min: testDesign1.price_range_min?.toString(),
      price_range_max: testDesign1.price_range_max?.toString()
    }).execute();

    // Create inactive design
    await db.insert(designsTable).values({
      ...testDesign2,
      price_range_min: testDesign2.price_range_min?.toString(),
      price_range_max: testDesign2.price_range_max?.toString(),
      is_active: false
    }).execute();

    const result = await getDesigns();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Elegant Wedding Card');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle numeric conversion correctly', async () => {
    await db.insert(designsTable).values({
      name: 'Price Test Design',
      category: 'Test',
      image_url: 'https://example.com/test.jpg',
      price_range_min: '199.99',
      price_range_max: '299.99'
    }).execute();

    const result = await getDesigns();

    expect(result).toHaveLength(1);
    expect(typeof result[0].price_range_min).toBe('number');
    expect(typeof result[0].price_range_max).toBe('number');
    expect(result[0].price_range_min).toBe(199.99);
    expect(result[0].price_range_max).toBe(299.99);
  });

  it('should include all required fields', async () => {
    await db.insert(designsTable).values({
      ...testDesign1,
      price_range_min: testDesign1.price_range_min?.toString(),
      price_range_max: testDesign1.price_range_max?.toString()
    }).execute();

    const result = await getDesigns();

    expect(result).toHaveLength(1);
    const design = result[0];
    
    expect(design.id).toBeDefined();
    expect(design.name).toBe('Elegant Wedding Card');
    expect(design.category).toBe('Wedding');
    expect(design.subcategory).toBe('Traditional');
    expect(design.image_url).toBe('https://example.com/wedding1.jpg');
    expect(design.description).toBe('Beautiful traditional wedding invitation');
    expect(design.tags).toBe('["wedding", "traditional", "elegant"]');
    expect(design.is_active).toBe(true);
    expect(design.created_at).toBeInstanceOf(Date);
    expect(design.updated_at).toBeInstanceOf(Date);
  });
});
