
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all users when no filters are applied', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Sales',
        phone: '+1234567890',
        is_active: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'Marketing',
        phone: '+1234567891',
        is_active: true
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'Operations',
        phone: '+1234567892',
        is_active: false
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].role).toEqual('Sales');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter users by role', async () => {
    // Create test users with different roles
    await db.insert(usersTable).values([
      {
        name: 'Sales Agent 1',
        email: 'sales1@example.com',
        role: 'Sales Agent',
        is_active: true
      },
      {
        name: 'Sales Agent 2',
        email: 'sales2@example.com',
        role: 'Sales Agent',
        is_active: true
      },
      {
        name: 'Marketing User',
        email: 'marketing@example.com',
        role: 'Marketing',
        is_active: true
      }
    ]).execute();

    const result = await getUsers({ role: 'Sales Agent' });

    expect(result).toHaveLength(2);
    expect(result[0].role).toEqual('Sales Agent');
    expect(result[1].role).toEqual('Sales Agent');
    expect(result[0].name).toEqual('Sales Agent 1');
    expect(result[1].name).toEqual('Sales Agent 2');
  });

  it('should filter users by active status', async () => {
    // Create test users with different active status
    await db.insert(usersTable).values([
      {
        name: 'Active User 1',
        email: 'active1@example.com',
        role: 'Sales',
        is_active: true
      },
      {
        name: 'Active User 2',
        email: 'active2@example.com',
        role: 'Operations',
        is_active: true
      },
      {
        name: 'Inactive User',
        email: 'inactive@example.com',
        role: 'Marketing',
        is_active: false
      }
    ]).execute();

    const activeResult = await getUsers({ is_active: true });
    expect(activeResult).toHaveLength(2);
    expect(activeResult[0].is_active).toBe(true);
    expect(activeResult[1].is_active).toBe(true);

    const inactiveResult = await getUsers({ is_active: false });
    expect(inactiveResult).toHaveLength(1);
    expect(inactiveResult[0].is_active).toBe(false);
    expect(inactiveResult[0].name).toEqual('Inactive User');
  });

  it('should filter users by both role and active status', async () => {
    // Create test users with various combinations
    await db.insert(usersTable).values([
      {
        name: 'Active Sales Agent',
        email: 'active-sales@example.com',
        role: 'Sales Agent',
        is_active: true
      },
      {
        name: 'Inactive Sales Agent',
        email: 'inactive-sales@example.com',
        role: 'Sales Agent',
        is_active: false
      },
      {
        name: 'Active Marketing',
        email: 'active-marketing@example.com',
        role: 'Marketing',
        is_active: true
      }
    ]).execute();

    const result = await getUsers({ role: 'Sales Agent', is_active: true });

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Sales Agent');
    expect(result[0].role).toEqual('Sales Agent');
    expect(result[0].is_active).toBe(true);
  });

  it('should return empty array when no users match filters', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        name: 'Sales User',
        email: 'sales@example.com',
        role: 'Sales',
        is_active: true
      }
    ]).execute();

    const result = await getUsers({ role: 'Customer Service' });

    expect(result).toHaveLength(0);
  });

  it('should handle empty database', async () => {
    const result = await getUsers();

    expect(result).toHaveLength(0);
  });
});
