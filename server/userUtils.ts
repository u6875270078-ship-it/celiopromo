import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

/**
 * User account generation utilities for team invitations
 */

/**
 * Generate a secure random password
 * @param length Password length (default: 12)
 * @returns Generated password
 */
export function generateSecurePassword(length: number = 12): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  
  // Ensure at least one character from each category
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';
  
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 * @param password Plain text password
 * @param hash Stored hash
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a username from email and name
 * @param email User email
 * @param firstName First name
 * @param lastName Last name
 * @returns Generated username
 */
export function generateUsername(email: string, firstName?: string, lastName?: string): string {
  // Try to create username from name first
  if (firstName && lastName) {
    const nameUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
    if (nameUsername.length >= 3) {
      return nameUsername;
    }
  }
  
  // Fallback to email-based username
  const emailPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return emailPart || `user${Date.now()}`;
}

/**
 * Generate team invitation token
 * @returns Secure random token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create user account data for team member invitation
 * @param email User email
 * @param firstName First name
 * @param lastName Last name
 * @param role User role
 * @returns User account data with credentials
 */
export async function createUserAccountForInvitation(
  email: string, 
  firstName: string, 
  lastName: string, 
  role: string = 'team_member'
) {
  const password = generateSecurePassword(12);
  const passwordHash = await hashPassword(password);
  const username = generateUsername(email, firstName, lastName);
  const invitationToken = generateInvitationToken();
  
  return {
    // User account data
    user: {
      email,
      username,
      passwordHash,
      firstName,
      lastName,
      role,
      isActive: true,
    },
    // Plain text credentials for email
    credentials: {
      username,
      password,
    },
    // Invitation data
    invitationToken,
    invitationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };
}