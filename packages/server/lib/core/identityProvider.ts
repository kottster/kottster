import { IdentityProviderUser, IdentityProviderRole, IdentityProviderUserPermission, ROOT_USER_ID, ClientIdentityProviderUser, IdentityProviderLoginAttempt, generateRandomString, Stage } from "@kottster/common";
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { KottsterApp } from "./app";
import knex, { Knex } from "knex";

/**
 * Supported hashing algorithms
 */
export enum HashAlgorithm {
  bcrypt = 'bcrypt',
  sha256 = 'sha256',
}

/**
 * JWT payload interface
 */
export interface JwtPayload {
  id: IdentityProviderUser['id'];
  check: string;
  iat?: number;
  exp?: number;
}

export enum IdentityProviderStrategyType {
  sqlite = 'sqlite',
}

export interface IdentityProviderOptions {
  fileName: string;
  passwordHashAlgorithm: keyof typeof HashAlgorithm;
  jwtSecretSalt?: string;
  rootUsername?: string;
  rootPassword?: string;
  rootCustomPermissions?: string[];
}

/**
 * The identity provider
 */
export class IdentityProvider {
  private app: KottsterApp;
  
  private jwtSecretSalt?: string;
  private passwordHashAlgorithm: keyof typeof HashAlgorithm;
  private rootUserUsername?: string;
  private rootUserPassword?: string;
  private rootUserSalt?: string;
  private rootCustomPermissions: string[] = [];

  private db: Knex;

  constructor({ 
    fileName,
    jwtSecretSalt,
    passwordHashAlgorithm = HashAlgorithm.bcrypt,
    rootUsername,
    rootPassword,
    rootCustomPermissions,
  }: IdentityProviderOptions) {
    this.jwtSecretSalt = jwtSecretSalt;
    this.passwordHashAlgorithm = passwordHashAlgorithm;
    this.rootUserUsername = rootUsername;
    this.rootUserPassword = rootPassword;
    this.rootCustomPermissions = rootCustomPermissions || [];

    this.db = knex({
      client: 'better-sqlite3',
      connection: {
        filename: fileName
      },
      useNullAsDefault: true
    });
  }

  /**
   * Prepare a user object for sending to the client by removing sensitive fields
   * @param user - The user object to prepare
   * @returns The prepared user object
   */
  public prepareUserForClient(user: IdentityProviderUser): ClientIdentityProviderUser {
    user.passwordHash = '';
    user.twoFactorSecret = undefined;
    user.jwtTokenCheck = undefined;

    return user as ClientIdentityProviderUser; 
  }

  /**
   * Prepare a role object for sending to the client by removing sensitive fields
   * @param role - The role object to prepare
   * @returns The prepared role object
   */
  public prepareRoleForClient(role: IdentityProviderRole): IdentityProviderRole {
    return role; 
  }

  get jwtSecret(): string | undefined {
    const appId = this.app.appId;
    const secretKey = this.app ? this.app.getSecretKey() : '';

    return `${appId}${secretKey}${this.jwtSecretSalt || ''}`;
  }

  setApp(app: KottsterApp): void {
    this.app = app;
  }

  recordLoginAttempt(attempt: Omit<IdentityProviderLoginAttempt, "id" | "attemptedAt">): Promise<void> {
    return this.createdLoginAttempt(attempt);
  }

  getRootUserSalt(): string {
    if (this.rootUserSalt) {
      return this.rootUserSalt;
    }

    // Generate a random salt for the root user but only for production
    const salt = this.app.stage === Stage.development ? '' : generateRandomString(24);

    this.rootUserSalt = salt;
    return salt;
  }

  async updateRole(roleId: IdentityProviderRole['id'], role: Partial<IdentityProviderRole>): Promise<IdentityProviderRole> {
    const existingRole = await this.getRoleBy('id', roleId);
    if (!existingRole) {
      throw new Error(`Role with ID "${roleId}" not found`);
    }

    const roleData: any = {};
    if (role.name !== undefined) roleData.name = role.name;
    if (role.permissions !== undefined) roleData.permissions = JSON.stringify(role.permissions);
    roleData.updated_at = this.db.fn.now();
    await this.db('roles').where({ id: roleId }).update(roleData);

    const updatedRole = await this.getRoleBy('id', roleId);
    if (!updatedRole) {
      throw new Error(`Failed to update role with ID "${roleId}"`);
    }

    return updatedRole;
  }

  async deleteRole(roleId: IdentityProviderRole['id']): Promise<void> {
    const existingRole = await this.getRoleBy('id', roleId);
    if (!existingRole) {
      throw new Error(`Role with ID "${roleId}" not found`);
    }

    await this.db('roles').where({ id: roleId }).delete();
  }

  async createUser(user: Omit<IdentityProviderUser, 'id' | 'passwordHash'>, password: string): Promise<IdentityProviderUser> {
    if (user.username && await this.getUserBy('username', user.username)) {
      throw new Error(`Username "${user.username}" is already taken`);
    }
    if (user.email && await this.getUserBy('email', user.email)) {
      throw new Error(`Email "${user.email}" is already taken`);
    }

    const passwordHash = password && await this.hashPassword(password);

    const finalData: any = {
      username: user.username,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      password_hash: passwordHash,
      avatar_url: user.avatarUrl,
      temporary_password: user.temporaryPassword,
      password_reset_token: user.passwordResetToken,
      two_factor_secret: user.twoFactorSecret,
      last_login_at: user.lastLoginAt,
      jwt_token_check: user.jwtTokenCheck,
      settings: user.settings ? JSON.stringify(user.settings) : null
    };
    
    const [userId] = await this.db('users').insert(finalData);
    
    if (user.roleIds && user.roleIds.length > 0) {
      const userRoles = user.roleIds.map(roleId => ({ user_id: userId, role_id: roleId }));
      await this.db('user_roles').insert(userRoles);
    }

    const createdUser = await this.getUserBy('id', userId);
    if (!createdUser) {
      throw new Error('Failed to create user');
    }

    return createdUser;
  }

  async updateUser(userId: IdentityProviderUser['id'], data: Partial<IdentityProviderUser>): Promise<IdentityProviderUser> {
    const existingUser = await this.getUserBy('id', userId);
    if (!existingUser) {
      throw new Error(`User with ID "${userId}" not found`);
    }

    if (data.username) {
      const otherUserWithSameUsername = await this.getUserWhere(q => q.where({ username: data.username }).whereNot({ id: existingUser.id }));
      if (otherUserWithSameUsername) {
        throw new Error(`Username "${data.username}" is already taken`);
      }
    }
    if (data.email) {
      const otherUserWithSameEmail = await this.getUserWhere(q => q.where({ email: data.email }).whereNot({ id: existingUser.id }));
      if (otherUserWithSameEmail) {
        throw new Error(`Email "${data.email}" is already taken`);
      }
    }

    if (Object.keys(data).length > 0 || data.settings !== undefined) {
      const finalData: any = {};
      if (data.username !== undefined) finalData.username = data.username;
      if (data.email !== undefined) finalData.email = data.email;
      if (data.firstName !== undefined) finalData.first_name = data.firstName;
      if (data.lastName !== undefined) finalData.last_name = data.lastName;
      if (data.avatarUrl !== undefined) finalData.avatar_url = data.avatarUrl;
      if (data.temporaryPassword !== undefined) finalData.temporary_password = data.temporaryPassword;
      if (data.passwordResetToken !== undefined) finalData.password_reset_token = data.passwordResetToken;
      if (data.twoFactorSecret !== undefined) finalData.two_factor_secret = data.twoFactorSecret;
      if (data.lastLoginAt !== undefined) finalData.last_login_at = data.lastLoginAt;
      if (data.jwtTokenCheck !== undefined) finalData.jwt_token_check = data.jwtTokenCheck;
      if (data.settings !== undefined) finalData.settings = JSON.stringify(data.settings);

      finalData.updated_at = this.db.fn.now();

      await this.db('users').where({ id: userId }).update(finalData);
    }

    if (data.roleIds !== undefined) {
      await this.db('user_roles').where({ user_id: userId }).delete();
      if (data.roleIds.length > 0) {
        const userRoles = data.roleIds.map(roleId => ({ user_id: userId, role_id: roleId }));
        await this.db('user_roles').insert(userRoles);
      }
    }

    const updatedUser = await this.getUserBy('id', userId);
    if (!updatedUser) {
      throw new Error(`Failed to update user with ID "${userId}"`);
    }

    return updatedUser;
  }

  async updateUserPassword(userId: IdentityProviderUser['id'], newPassword: string, temporaryPassword?: boolean): Promise<void> {
    const existingUser = await this.getUserBy('id', userId);
    if (!existingUser) {
      throw new Error(`User with ID "${userId}" not found`);
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.db('users').where({ id: userId }).update({ password_hash: passwordHash, temporary_password: temporaryPassword ?? undefined });
  }

  async deleteUser(userId: IdentityProviderUser['id']): Promise<void> {
    if (this.isUserRoot(userId)) {
      throw new Error('Cannot delete root user');
    }

    const existingUser = await this.getUserBy('id', userId);
    if (!existingUser) {
      throw new Error(`User with ID "${userId}" not found`);
    }

    await this.db('users').where({ id: userId }).delete();
  }

  async getUserPermissions(userId: number | string): Promise<string[]> {
    if (this.isUserRoot(userId)) {
      return [
        ...Object.keys(IdentityProviderUserPermission) as string[],
        ...this.rootCustomPermissions,
      ];
    }

    const user = await this.getUserBy('id', userId);
    if (!user) return [];
    
    const userRoles = await this.getRolesByIds(user.roleIds || []);
    const permissions: string[] = [];

    userRoles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(permission => {
          if (!permissions.includes(permission)) {
            permissions.push(permission);
          }
        });
      }
    });

    return permissions;
  }

  /**
   * Hash a password using the configured algorithm
   */
  async hashPassword(password: string): Promise<string> {
    switch (this.passwordHashAlgorithm) {
      case HashAlgorithm.bcrypt:
        return bcrypt.hash(password, 10);
      
      case HashAlgorithm.sha256:
        return crypto.createHash('sha256').update(password).digest('hex');
      
      default:
        throw new Error(`Unsupported hash algorithm: ${this.passwordHashAlgorithm}`);
    }
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    switch (this.passwordHashAlgorithm) {
      case HashAlgorithm.bcrypt:
        return bcrypt.compare(password, hash);
      case HashAlgorithm.sha256: {
        const testHash = crypto.createHash('sha256').update(password).digest('hex');
        return testHash === hash;
      };
      default:
        throw new Error(`Unsupported hash algorithm: ${this.passwordHashAlgorithm}`);
    }
  }

  public getRootUserByUsername(username: string): IdentityProviderUser | undefined {
    if (!this.rootUserUsername || !this.rootUserPassword) {
      return undefined;
    }
    if (username !== this.rootUserUsername) {
      return undefined;
    }

    return {
      id: ROOT_USER_ID,
      username: this.rootUserUsername,
      passwordHash: '',
      roleIds: [],
      jwtTokenCheck: this.getRootUserSalt(),
    }
  };

  public getRootUserById(userId: number | string): IdentityProviderUser | undefined {
    if (!this.rootUserUsername || !this.rootUserPassword) {
      return undefined;
    }

    if (userId !== ROOT_USER_ID) {
      return undefined;
    }

    return {
      id: ROOT_USER_ID,
      username: this.rootUserUsername,
      passwordHash: '',
      roleIds: [],
      jwtTokenCheck: this.getRootUserSalt(),
    };
  }

  isUserRoot(userId: number | string): boolean {
    return userId === ROOT_USER_ID;
  }

  async authenticateRootUser(username: string, password: string): Promise<IdentityProviderUser> {
    if (!this.rootUserUsername || !this.rootUserPassword) {
      throw new Error('Root user not configured');
    }
    if (username !== this.rootUserUsername) {
      throw new Error('Invalid username/email or password');
    }

    const isValid = password === this.rootUserPassword;
    if (!isValid) {
      throw new Error('Invalid username/email or password');
    }

    const rootUser = this.getRootUserByUsername(username);
    if (!rootUser) {
      throw new Error('Root user not configured');
    }
    return rootUser;
  }

  /**
   * Authenticate a user by username/email and password
   * @param usernameOrEmail - Username or email to identify the user
   * @param password - Plain text password to check
   * @returns Authenticated user
   */
  async authenticateUser(usernameOrEmail: string, password: string): Promise<IdentityProviderUser> {
    const rootUser = this.getRootUserByUsername(usernameOrEmail);
    if (rootUser) {
      const isValid = await this.verifyPassword(password, this.rootUserPassword!);
      if (!isValid) {
        throw new Error('Invalid username/email or password');
      }

      return { ...rootUser };
    } else {
      const user = await this.getUserBy('username', usernameOrEmail) || await this.getUserBy('email', usernameOrEmail);
      if (!user) {
        throw new Error('Invalid username/email or password');
      }
      if (!user.passwordHash) {
        throw new Error('User has no password set');
      }
      
      const isValid = await this.verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid username/email or password');
      }
      return { ...user };
    }
  }

  /**
   * Generate a JWT token for the root user
   * @param expiresIn - Token expiration in seconds (default: 24h = 86400s)
   * @returns JWT token string
   */
  async generateTokenForRootUser(expiresIn: number = 86400, providedJwtSecret?: string): Promise<string> {
    const payload: JwtPayload = {
      id: ROOT_USER_ID,
      check: this.getRootUserSalt(),
    };

    const secret = new TextEncoder().encode(providedJwtSecret ?? this.jwtSecret);
    
    return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
      .sign(secret);
  }

  /**
   * Generate a JWT token for a user
   * @param usernameOrEmail - Username or email to identify the user
   * @param expiresIn - Token expiration in seconds (default: 24h = 86400s)
   * @returns JWT token string
   */
  async generateToken(userId: number | string, expiresIn: number = 86400): Promise<string> {
    if (!this.jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    const user = await this.getUserBy('id', userId);
    if (!user) {
      throw new Error('User not found');
    }

    let jwtTokenCheck = user.jwtTokenCheck;
    if (!jwtTokenCheck) {
      jwtTokenCheck = crypto.randomBytes(16).toString('hex');
      await this.updateUser(user.id, { jwtTokenCheck });
    }

    const payload: JwtPayload = {
      id: user.id,
      check: jwtTokenCheck,
    };

    const secret = new TextEncoder().encode(`${this.jwtSecret}`);
    
    return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
      .sign(secret);
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token to verify
   * @returns Decoded JWT payload or null if invalid
   */
  async verifyToken(token: string): Promise<JwtPayload | null> {
    if (!this.jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    try {
      const secret = new TextEncoder().encode(this.jwtSecret);
      const { payload } = await jwtVerify(token, secret);
      return payload as unknown as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  async verifyTokenAndGetUser(token: string): Promise<IdentityProviderUser> {
    const payload = await this.verifyToken(token);
    if (!payload || !payload.id) {
      throw new Error('Invalid token');
    }

    // If it's the root user, return the root user
    const rootUser = this.getRootUserById(payload.id);
    if (rootUser) {
      if (rootUser.jwtTokenCheck !== payload.check) {
        throw new Error('Invalid token');
      }

      return { ...rootUser };
    }
    
    const user = await this.getUserBy('id', payload.id);
    if (!user) {
      throw new Error('Invalid token');
    }
    if (user.jwtTokenCheck !== payload.check) {
      throw new Error('Invalid token');
    }
    
    return { ...user };
  }

  /**
   * Check if a user has a specific role by role ID
   */
  async userHasRole(userId: number | string, roleId: number | string): Promise<boolean> {
    const isRoot = this.isUserRoot(userId);
    if (isRoot) {
      return true;
    }
    
    const user = await this.getUserBy('id', userId);
    if (!user) return false;
    
    return user.roleIds?.includes(roleId) ?? false;
  }

  async userHasPermissions(userId: number | string, permissions: (keyof typeof IdentityProviderUserPermission | string)[]): Promise<boolean> {
    const isRoot = this.isUserRoot(userId);
    if (isRoot) {
      return true;
    }
    
    const userPermissions = await this.getUserPermissions(userId);
    for (const permission of permissions) {
      if (!userPermissions.includes(permission)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a user has a specific role by role name
   */
  async userHasRoleByName(userId: number | string, roleName: string): Promise<boolean> {
    const user = await this.getUserBy('id', userId);
    if (!user) return false;

    const role = await this.getRoleBy('name', roleName);
    if (!role) return false;
    
    return user.roleIds?.includes(role.id) ?? false;
  }

  /**
   * Get all roles for a specific user
   */
  async getUserRoles(userId: number | string): Promise<IdentityProviderRole[]> {
    const user = await this.getUserBy('id', userId);
    if (!user || !user.roleIds) return [];

    const roles = await this.getRolesByIds(user.roleIds);
    return roles;
  }

  public async initialize(): Promise<void> {
    await this.ensureTablesExist();
  }

  private async ensureTablesExist(): Promise<void> {
    const usersTableExists = await this.db.schema.hasTable('users');
    if (!usersTableExists) {
      await this.createUsersTable();
    }

    const rolesTableExists = await this.db.schema.hasTable('roles');
    if (!rolesTableExists) {
      await this.createRolesTable();
    }

    const userRolesTableExists = await this.db.schema.hasTable('user_roles');
    if (!userRolesTableExists) {
      await this.createUserRolesTable();
    }

    const loginAttemptsTableExists = await this.db.schema.hasTable('login_attempts');
    if (!loginAttemptsTableExists) {
      await this.createLoginAttemptsTable();
    }

    const schemaVersionsTableExists = await this.db.schema.hasTable('schema_versions');
    if (!schemaVersionsTableExists) {
      await this.createSchemaVersionsTable();
    }
  }

  private async createUsersTable(): Promise<void> {
    await this.db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('username').nullable().index();
      table.string('email').nullable().index();
      table.string('first_name').nullable();
      table.string('last_name').nullable();
      table.string('password_hash').nullable();
      table.string('avatar_url').nullable();
      table.boolean('temporary_password').nullable().defaultTo(false);
      table.string('password_reset_token').nullable();
      table.string('two_factor_secret').nullable();
      table.timestamp('last_login_at').nullable();
      table.string('jwt_token_check').nullable();
      table.json('settings').nullable();
      table.timestamps(true, true);
    });
  }

  private async createRolesTable(): Promise<void> {
    await this.db.schema.createTable('roles', (table) => {
      table.increments('id').primary();
      table.string('name').nullable();
      table.json('permissions').nullable();
      table.timestamps(true, true);
    });
  }

  private async createUserRolesTable(): Promise<void> {
    await this.db.schema.createTable('user_roles', (table) => {
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('role_id').references('id').inTable('roles').onDelete('CASCADE');
      table.primary(['user_id', 'role_id']);
    });
  }

  private async createLoginAttemptsTable(): Promise<void> {
    await this.db.schema.createTable('login_attempts', (table) => {
      table.increments('id').primary();
      table.string('ip_address').nullable().index();
      table.string('identifier').nullable().index();
      table.integer('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.boolean('success').nullable().defaultTo(false);
      table.string('failure_reason').nullable();
      table.string('user_agent').nullable();
      table.timestamp('attempted_at').defaultTo(this.db.fn.now()).index();
    });
  }

  private async createSchemaVersionsTable(): Promise<void> {
    await this.db.schema.createTable('schema_versions', (table) => {
      table.string('table_name').primary();
      table.integer('version').notNullable();
      table.timestamps(true, true);
    });

    // Insert initial version records for all tables
    await this.db('schema_versions').insert([
      { table_name: 'users', version: 1 },
      { table_name: 'roles', version: 1 },
      { table_name: 'user_roles', version: 1 },
      { table_name: 'login_attempts', version: 1 },
      { table_name: 'schema_versions', version: 1 }
    ]);
  }

  async getUserBy(field: 'id' | 'email' | 'username', value: string | number): Promise<IdentityProviderUser | null> {
    const user = await this.db('users').where({ [field]: value }).first();
    if (!user) return null;
    
    const roleIds = await this.db('user_roles')
      .where({ user_id: user.id })
      .pluck('role_id');
    
    return this.mapUserFromDb(user, roleIds);
  }

  async getUserWhere(where: Record<string, any> | ((qb: Knex.QueryBuilder) => void)): Promise<IdentityProviderUser | null> {
    const query = this.db('users');
    
    if (typeof where === 'function') {
      where(query);
    } else {
      query.where(where);
    }
    
    const user = await query.first();
    if (!user) return null;
    
    const roleIds = await this.db('user_roles')
      .where({ user_id: user.id })
      .pluck('role_id');
    
    return this.mapUserFromDb(user, roleIds);
  }

  async getUsers(): Promise<IdentityProviderUser[]> {
    const users = await this.db('users').select().orderBy('id', 'desc');
    
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roleIds = await this.db('user_roles')
          .where({ user_id: user.id })
          .pluck('role_id');
        return this.mapUserFromDb(user, roleIds);
      })
    );
    
    return usersWithRoles;
  }

  private mapUserFromDb(dbUser: any, roleIds: any[]): IdentityProviderUser {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      passwordHash: dbUser.password_hash,
      avatarUrl: dbUser.avatar_url,
      temporaryPassword: dbUser.temporary_password,
      passwordResetToken: dbUser.password_reset_token,
      twoFactorSecret: dbUser.two_factor_secret,
      lastLoginAt: dbUser.last_login_at,
      jwtTokenCheck: dbUser.jwt_token_check,
      settings: dbUser.settings ? JSON.parse(dbUser.settings) : undefined,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      roleIds
    };
  }

  // Role CRUD methods
  async createRole(role: Omit<IdentityProviderRole, 'id'>): Promise<IdentityProviderRole> {
    const roleData: any = {
      name: role.name,
      permissions: role.permissions ? JSON.stringify(role.permissions) : null,
    };
    
    const [roleId] = await this.db('roles').insert(roleData);
    const createdRole = await this.getRoleBy('id', roleId);
    if (!createdRole) {
      throw new Error('Failed to create role');
    }
    
    return createdRole;
  }

  async getRoleBy(field: 'id' | 'name', value: string | number): Promise<IdentityProviderRole | null> {
    const role = await this.db('roles').where({ [field]: value }).first();
    if (!role) return null;
    
    return this.mapRoleFromDb(role);
  }

  async getRolesByIds(roleIds: IdentityProviderRole['id'][]): Promise<IdentityProviderRole[]> {
    if (roleIds.length === 0) return [];
    
    const roles = await this.db('roles').whereIn('id', roleIds).select();
    
    return roles.map(role => this.mapRoleFromDb(role));
  }

  async getRoles(): Promise<IdentityProviderRole[]> {
    const roles = await this.db('roles').select().orderBy('id', 'desc');
    
    return roles.map(role => this.mapRoleFromDb(role));
  }

  private mapRoleFromDb(dbRole: any): IdentityProviderRole {
    return {
      id: dbRole.id,
      name: dbRole.name,
      permissions: dbRole.permissions ? JSON.parse(dbRole.permissions) : undefined,
      createdAt: dbRole.created_at,
      updatedAt: dbRole.updated_at
    };
  }

  async createdLoginAttempt(attempt: Omit<IdentityProviderLoginAttempt, 'id' | 'attemptedAt'>): Promise<void> {
    await this.db('login_attempts').insert({
      ip_address: attempt.ipAddress,
      identifier: attempt.identifier,
      user_id: attempt.userId,
      success: attempt.success,
      failure_reason: attempt.failureReason,
      user_agent: attempt.userAgent
    });
  }

  async getRecentFailedAttempts(
    identifier: string, 
    ipAddress: string, 
    minutes: number = 10
  ): Promise<number> {
    const cutoffDate = new Date(Date.now() - minutes * 60 * 1000);
    const cutoff = cutoffDate.toISOString().slice(0, 19).replace('T', ' ');

    const count = await this.db('login_attempts')
      .where((qb) => {
        qb.where({ identifier }).orWhere({ ip_address: ipAddress });
      })
      .where('success', false)
      .where('attempted_at', '>=', cutoff)
      .count('id as count');
    
    return +count[0]?.count || 0;
  }

  async isIpBlocked(ipAddress: string, maxAttempts: number = 10, minutes: number = 15): Promise<boolean> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    
    const count = await this.db('login_attempts')
      .where({ ip_address: ipAddress })
      .where('success', false)
      .where('attempted_at', '>=', cutoff)
      .count('id as count');
    
    return (+count[0]?.count || 0) >= maxAttempts;
  }

  async cleanOldLoginAttempts(daysToKeep: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    return await this.db('login_attempts')
      .where('attempted_at', '<', cutoff)
      .delete();
  }

  async updateLastLoginAt(userId: IdentityProviderUser['id']): Promise<void> {
    await this.db('users')
      .where({ id: userId })
      .update({ 
        last_login_at: this.db.fn.now(),
        updated_at: this.db.fn.now()
      });
  }

  async invalidateAllSessions(userId: IdentityProviderUser['id']): Promise<void> {
    const newSalt = generateRandomString(24);
    await this.db('users')
      .where({ id: userId })
      .update({ 
        jwt_token_check: newSalt,
        updated_at: this.db.fn.now()
      });
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }

  getDb(): Knex {
    return this.db;
  }
}