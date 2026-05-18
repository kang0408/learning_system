# Phase 2: Backend Base & Authentication Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Xây dựng cấu trúc cơ bản cho backend API (Express), cài đặt global middlewares và hoàn thiện module Authentication (Register, Login, JWT, RBAC).

**Architecture:** MVC + Service Layer + Repository Pattern (using Prisma).

**Tech Stack:** Node.js, Express, Prisma, JWT, bcrypt, zod, supertest, jest.

---

### Task 1: API Project Setup & Healthcheck

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/jest.config.js`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/__tests__/health.test.ts`

**Step 1: Write the failing test**
Run command: 
```bash
cd apps/api && npm install express cors dotenv helmet zod express-async-errors && npm install -D typescript @types/node @types/express @types/cors jest ts-jest @types/jest supertest @types/supertest ts-node-dev
```
Create `apps/api/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "src",
    "outDir": "dist",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```
Create `apps/api/jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts']
};
```
Create `apps/api/src/__tests__/health.test.ts`:
```typescript
import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```
Create empty `apps/api/src/app.ts`:
```typescript
export default {};
```

**Step 2: Run test to verify it fails**
Run: `cd apps/api && npx jest src/__tests__/health.test.ts`
Expected: FAIL (app is not a function)

**Step 3: Write minimal implementation**
Update `apps/api/src/app.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
```
Create `apps/api/src/server.ts`:
```typescript
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```
Update `apps/api/package.json` scripts:
```json
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest"
  }
```

**Step 4: Run test to verify it passes**
Run: `cd apps/api && npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/api
git commit -m "feat(api): setup express server, jest, and healthcheck"
```

---

### Task 2: Prisma Client & Global Error Handler

**Files:**
- Create: `apps/api/src/lib/prisma.ts`
- Create: `apps/api/src/middlewares/error.middleware.ts`
- Modify: `apps/api/src/app.ts`

**Step 1: Write the failing test**
(Skipped for DB config and Error Handler - we will test it implicitly in the next tasks)

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
Create `apps/api/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```
Create `apps/api/src/middlewares/error.middleware.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}
```
Update `apps/api/src/app.ts` to add the error handler at the end:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Add error handler as the last middleware
app.use(errorHandler);

export default app;
```

**Step 4: Run test to verify it passes**
Run: `cd apps/api && npm run test` (to ensure nothing is broken)
Expected: PASS

**Step 5: Commit**
```bash
git add apps/api/src/lib apps/api/src/middlewares apps/api/src/app.ts
git commit -m "feat(api): add prisma client and global error handler"
```

---

### Task 3: Auth Module - Register API

**Files:**
- Create: `apps/api/src/modules/auth/auth.schema.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.routes.ts`

**Step 1: Write the failing test**
Run command to install bcrypt: 
```bash
cd apps/api && npm install bcrypt && npm install -D @types/bcrypt
```
Create `apps/api/src/modules/auth/__tests__/register.test.ts` (Mocking Prisma):
```typescript
import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';

// Mock prisma client
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    }
  }
}));

describe('POST /api/auth/register', () => {
  it('should return 400 if validation fails', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('should register a new user successfully', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'uuid',
      email: 'test@test.com',
      full_name: 'Test User',
      role: 'student'
    });

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@test.com',
      password: 'password123',
      full_name: 'Test User',
      role: 'student'
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@test.com');
  });
});
```
Add route mounting to `apps/api/src/app.ts` (just before `app.use(errorHandler)`):
```typescript
import authRoutes from './modules/auth/auth.routes';
app.use('/api/auth', authRoutes);
```
Create empty `apps/api/src/modules/auth/auth.routes.ts`:
```typescript
import { Router } from 'express';
const router = Router();
export default router;
```

**Step 2: Run test to verify it fails**
Run: `cd apps/api && npx jest src/modules/auth/__tests__/register.test.ts`
Expected: FAIL (404 Not Found)

**Step 3: Write minimal implementation**
Create `apps/api/src/modules/auth/auth.schema.ts`:
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  role: z.enum(['student', 'teacher', 'parent'])
});
```
Create `apps/api/src/modules/auth/auth.service.ts`:
```typescript
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';

export class AuthService {
  static async register(data: any) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw { status: 400, message: 'Email already exists' };
    }
    
    const password_hash = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash,
        full_name: data.full_name,
        role: data.role
      },
      select: { id: true, email: true, full_name: true, role: true }
    });
    
    return user;
  }
}
```
Create `apps/api/src/modules/auth/auth.controller.ts`:
```typescript
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema } from './auth.schema';

export class AuthController {
  static async register(req: Request, res: Response) {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error });
    }
    
    const user = await AuthService.register(parseResult.data);
    res.status(201).json({ user });
  }
}
```
Update `apps/api/src/modules/auth/auth.routes.ts`:
```typescript
import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();

router.post('/register', AuthController.register);

export default router;
```

**Step 4: Run test to verify it passes**
Run: `cd apps/api && npx jest src/modules/auth/__tests__/register.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/api/src/modules/auth apps/api/src/app.ts
git commit -m "feat(api): implement user registration with validation"
```

---

### Task 4: Auth Module - Login & JWT

**Files:**
- Modify: `apps/api/src/modules/auth/auth.schema.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/api/src/modules/auth/auth.controller.ts`
- Modify: `apps/api/src/modules/auth/auth.routes.ts`

**Step 1: Write the failing test**
Run command:
```bash
cd apps/api && npm install jsonwebtoken && npm install -D @types/jsonwebtoken
```
Create `apps/api/src/modules/auth/__tests__/login.test.ts`:
```typescript
import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() }
  }
}));

describe('POST /api/auth/login', () => {
  it('should login successfully and return token', async () => {
    const hash = await bcrypt.hash('password123', 10);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'uuid',
      email: 'test@test.com',
      password_hash: hash,
      role: 'student'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@test.com',
      password: 'password123'
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `cd apps/api && npx jest src/modules/auth/__tests__/login.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
Update `apps/api/src/modules/auth/auth.schema.ts`:
```typescript
// (Add to existing schema file)
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
```
Update `apps/api/src/modules/auth/auth.service.ts` to add `login` method:
```typescript
import jwt from 'jsonwebtoken';
// ... inside AuthService class ...
  static async login(data: any) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw { status: 401, message: 'Invalid credentials' };
    
    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) throw { status: 401, message: 'Invalid credentials' };
    
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '7d' });
    
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }
```
Update `apps/api/src/modules/auth/auth.controller.ts` to add `login` method:
```typescript
import { loginSchema } from './auth.schema';
// ... inside AuthController class ...
  static async login(req: Request, res: Response) {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error });
    }
    const result = await AuthService.login(parseResult.data);
    res.json(result);
  }
```
Update `apps/api/src/modules/auth/auth.routes.ts`:
```typescript
router.post('/login', AuthController.login);
```

**Step 4: Run test to verify it passes**
Run: `cd apps/api && npx jest src/modules/auth/__tests__/login.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/api/src/modules/auth
git commit -m "feat(api): implement login and jwt generation"
```

---

### Task 5: Auth Middleware & RBAC

**Files:**
- Create: `apps/api/src/middlewares/auth.middleware.ts`
- Modify: `apps/api/src/modules/auth/auth.routes.ts`

**Step 1: Write the failing test**
Create `apps/api/src/modules/auth/__tests__/middleware.test.ts`:
```typescript
import request from 'supertest';
import app from '../../../app';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  it('should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should accept with valid token', async () => {
    const token = jwt.sign({ userId: 'uuid', role: 'student' }, process.env.JWT_SECRET || 'fallback_secret');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `cd apps/api && npx jest src/modules/auth/__tests__/middleware.test.ts`
Expected: FAIL (404 Not Found for `/api/auth/me`)

**Step 3: Write minimal implementation**
Create `apps/api/src/middlewares/auth.middleware.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const payload = jwt.verify(token, secret) as any;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```
Update `apps/api/src/modules/auth/auth.routes.ts`:
```typescript
import { requireAuth } from '../../middlewares/auth.middleware';

// Add this route for testing middleware
router.get('/me', requireAuth, (req: any, res) => {
  res.json({ user: req.user });
});
```

**Step 4: Run test to verify it passes**
Run: `cd apps/api && npx jest src/modules/auth/__tests__/middleware.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/api/src/middlewares apps/api/src/modules/auth
git commit -m "feat(api): implement jwt auth and rbac middlewares"
```
