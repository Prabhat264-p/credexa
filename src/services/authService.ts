import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "credexa_hackathon_super_secret_jwt_key_2026";

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (err) {
    return null;
  }
}

export const verifyJwt = verifyToken;

export function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, ...cleanUser } = user;
  const phoneVal = cleanUser.phone || cleanUser.phoneNumber || null;
  return {
    ...cleanUser,
    phone: phoneVal,
    phoneNumber: phoneVal,
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  return sanitizeUser(user);
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "FINANCEE" | "FINANCER" | "ADMIN",
  organizationName?: string,
  gstin?: string,
  walletAddress?: string,
  phoneNumber?: string
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const pHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: pHash,
      role: role as Role,
      organizationName,
      gstin,
      walletAddress,
      phone: phoneNumber,
      isVerified: true,
      isDemo: false,
    },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: sanitizeUser(user), token };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: sanitizeUser(user), token };
}

export async function updateUserProfile(id: string, updates: Record<string, any>) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      name: updates.name,
      organizationName: updates.organizationName,
      organizationType: updates.organizationType,
      gstin: updates.gstin,
      walletAddress: updates.walletAddress,
      phone: updates.phone || updates.phoneNumber,
    },
  });
  return sanitizeUser(user);
}
