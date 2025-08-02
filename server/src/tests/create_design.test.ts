
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { designsTable } from '../db/schema';
import { type CreateDesignInput } from '../schema';
import { createDesign } from '../handlers/create_design';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateDesignInput = {
  name: 'Diamond Solitaire Ring',
  category: 'Rings',
  subcategory: 'Engagement',
  image_url: 'https://example.com/diamond-ring.jpg',
  description: 'Beautiful diamond solitaire engagement ring',
  price_range_min: 50000,
  price_range_max: 150000,
  tags: '["diamond", "solitaire", "engagement", "classic"]'
};

describe('createDesign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a design with all fields', async () => {
    const result = await createDesign(testInput);

    // Basic field validation
    expect(result.name).toEqual('Diamond Solitaire Ring');
    expect(result.category).toEqual('Rings');
    expect(result.subcategory).toEqual('Engagement');
    expect(result.image_url).toEqual('https://example.com/diamond-ring.jpg');
    expect(result.description).toEqual('Beautiful diamond solitaire engagement ring');
    expect(result.price_range_min).toEqual(50000);
    expect(result.price_range_max).toEqual(150000);
    expect(result.tags).toEqual('["diamond", "solitaire", "engagement", "classic"]');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result.price_range_min).toBe('number');
    expect(typeof result.price_range_max).toBe('number');
  });

  it('should create a design with minimal fields', async () => {
    const minimalInput: CreateDesignInput = {
      name: 'Simple Ring',
      category: 'Rings',
      image_url: 'https://example.com/simple-ring.jpg'
    };

    const result = await createDesign(minimalInput);

    expect(result.name).toEqual('Simple Ring');
    expect(result.category).toEqual('Rings');
    expect(result.subcategory).toBeNull();
    expect(result.image_url).toEqual('https://example.com/simple-ring.jpg');
    expect(result.description).toBeNull();
    expect(result.price_range_min).toBeNull();
    expect(result.price_range_max).toBeNull();
    expect(result.tags).toBeNull();
    expect(result.is_active).toEqual(true);
  });

  it('should save design to database', async () => {
    const result = await createDesign(testInput);

    // Query using proper drizzle syntax
    const designs = await db.select()
      .from(designsTable)
      .where(eq(designsTable.id, result.id))
      .execute();

    expect(designs).toHaveLength(1);
    expect(designs[0].name).toEqual('Diamond Solitaire Ring');
    expect(designs[0].category).toEqual('Rings');
    expect(designs[0].subcategory).toEqual('Engagement');
    expect(designs[0].image_url).toEqual('https://example.com/diamond-ring.jpg');
    expect(designs[0].description).toEqual('Beautiful diamond solitaire engagement ring');
    expect(parseFloat(designs[0].price_range_min!)).toEqual(50000);
    expect(parseFloat(designs[0].price_range_max!)).toEqual(150000);
    expect(designs[0].tags).toEqual('["diamond", "solitaire", "engagement", "classic"]');
    expect(designs[0].is_active).toEqual(true);
    expect(designs[0].created_at).toBeInstanceOf(Date);
    expect(designs[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle designs with only one price range value', async () => {
    const inputWithMinPrice: CreateDesignInput = {
      name: 'Budget Ring',
      category: 'Rings',
      image_url: 'https://example.com/budget-ring.jpg',
      price_range_min: 25000
    };

    const result = await createDesign(inputWithMinPrice);

    expect(result.price_range_min).toEqual(25000);
    expect(result.price_range_max).toBeNull();
    expect(typeof result.price_range_min).toBe('number');
  });

  it('should create multiple designs in same category', async () => {
    const design1: CreateDesignInput = {
      name: 'Ring Design 1',
      category: 'Rings',
      image_url: 'https://example.com/ring1.jpg'
    };

    const design2: CreateDesignInput = {
      name: 'Ring Design 2',
      category: 'Rings',
      image_url: 'https://example.com/ring2.jpg'
    };

    const result1 = await createDesign(design1);
    const result2 = await createDesign(design2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Ring Design 1');
    expect(result2.name).toEqual('Ring Design 2');
    expect(result1.category).toEqual('Rings');
    expect(result2.category).toEqual('Rings');

    // Verify both are saved in database
    const allDesigns = await db.select()
      .from(designsTable)
      .execute();

    expect(allDesigns).toHaveLength(2);
  });
});
