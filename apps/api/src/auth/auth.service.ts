import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { Prisma } from '../generated/prisma/client.js';
import type { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type JwtPayload = { sub: string; role: Role };

@Injectable()
export class AuthService {
  // Verified when the email doesn't exist, so "no such user" takes as long as
  // "wrong password" and response timing can't reveal which emails are registered.
  private readonly dummyHash = hash('not-a-real-password');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register({ email, password }: RegisterDto) {
    const passwordHash = await hash(password);
    try {
      const user = await this.prisma.user.create({
        data: { email, passwordHash },
        select: publicUserSelect,
      });
      return { user, token: await this.signToken(user) };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('An account with that email already exists');
      }
      throw err;
    }
  }

  async login({ email, password }: LoginDto) {
    const found = await this.prisma.user.findUnique({
      where: { email },
      select: { ...publicUserSelect, passwordHash: true },
    });
    const valid = await verify(found?.passwordHash ?? (await this.dummyHash), password);
    if (!found || !valid) throw new UnauthorizedException('Invalid email or password');

    const { passwordHash, ...user } = found;
    return { user, token: await this.signToken(user) };
  }

  private signToken(user: { id: string; role: Role }) {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return this.jwt.signAsync(payload);
  }
}
