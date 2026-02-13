/**
 * User Repository Interface
 *
 * Defines the contract for user data access.
 * Implemented by infrastructure layer (ConvexUserRepository).
 */

export interface User {
  id: string;
  clerkId: string;
  username: string;
  email: string;
  avatarUrl?: string;
  totalXP: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRepository {
  /**
   * Get a user by ID
   */
  getById(id: string): Promise<User | null>;

  /**
   * Get a user by Clerk ID
   */
  getByClerkId(clerkId: string): Promise<User | null>;

  /**
   * Get a user by username
   */
  getByUsername(username: string): Promise<User | null>;

  /**
   * Update user XP and level
   */
  updateXP(userId: string, xpToAdd: number, newLevel: number): Promise<User>;

  /**
   * Create a new user
   */
  create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;

  /**
   * Update user profile
   */
  update(
    userId: string,
    updates: Partial<Pick<User, "username" | "avatarUrl">>
  ): Promise<User>;
}
