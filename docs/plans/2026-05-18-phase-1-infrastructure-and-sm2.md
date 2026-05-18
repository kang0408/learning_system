# Phase 1: Infrastructure & SM-2 Engine Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Khởi tạo kiến trúc monorepo bằng npm workspaces, thiết lập database (PostgreSQL + Redis) qua Docker, định nghĩa Prisma schema và cài đặt core thuật toán SM-2 (TDD) với Test Coverage.

**Architecture:** Sử dụng npm workspaces để quản lý packages và apps. Prisma làm ORM. `sm2-engine` là pure package độc lập không phụ thuộc DB hay API, được test bằng Jest.

**Tech Stack:** Node.js, npm workspaces, TypeScript, Prisma, Jest.

---

### Task 1: Setup Root Monorepo & Configs

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`

**Step 1: Write the failing test**
(Skipped for configuration task - script verification instead)

**Step 2: Run test to verify it fails**
Run: `npm i`
Expected: Error or just nothing if package.json is missing/invalid.

**Step 3: Write minimal implementation**
Create `package.json`:
```json
{
  "name": "adaptive-lang",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

Create `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Create `.gitignore`:
```text
node_modules
dist
.env
```

**Step 4: Run test to verify it passes**
Run: `npm i`
Expected: PASS (Tạo thư mục node_modules thành công)

**Step 5: Commit**
```bash
git add package.json tsconfig.base.json .gitignore
git commit -m "chore: setup monorepo root and typescript config"
```

---

### Task 2: Setup Docker & Database Config

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

**Step 1: Write the failing test**
Run: `docker-compose config`
Expected: FAIL (no docker-compose.yml)

**Step 2: Run test to verify it fails**
Run: `docker-compose config`
Expected: FAIL

**Step 3: Write minimal implementation**
Create `docker-compose.yml`:
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: adaptive_lang_db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: adaptive_lang_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: adaptive_lang_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Create `.env.example`:
```bash
# ─── Database ────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/adaptive_lang_dev
DATABASE_URL_TEST=postgresql://user:password@localhost:5432/adaptive_lang_test

# ─── Redis ───────────────────────────────
REDIS_URL=redis://localhost:6379
```

**Step 4: Run test to verify it passes**
Run: `docker-compose config`
Expected: PASS (hiển thị thông tin config hợp lệ)

**Step 5: Commit**
```bash
git add docker-compose.yml .env.example
git commit -m "chore: add docker-compose for local database"
```

---

### Task 3: Initialize Prisma & Schema

**Files:**
- Create: `apps/api/package.json`
- Modify: `apps/api/prisma/schema.prisma`

**Step 1: Write the failing test**
Run: `npx prisma validate`
Expected: FAIL (no schema found)

**Step 2: Run test to verify it fails**
(See above)

**Step 3: Write minimal implementation**
Create `apps/api/package.json`:
```json
{
  "name": "@adaptive-lang/api",
  "version": "1.0.0",
  "private": true,
  "devDependencies": {
    "prisma": "^5.0.0"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0"
  }
}
```

Run command: `cd apps/api && npm install && npx prisma init`

Cập nhật `apps/api/prisma/schema.prisma` thành:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique @db.VarChar(255)
  password_hash String    @db.VarChar(255)
  full_name     String    @db.VarChar(100)
  role          String    @db.VarChar(20)
  avatar_url    String?   @db.VarChar(500)
  is_active     Boolean   @default(true)
  created_at    DateTime  @default(now()) @db.Timestamptz
  updated_at    DateTime  @default(now()) @updatedAt @db.Timestamptz
  deleted_at    DateTime? @db.Timestamptz

  classes          Class[]
  class_members    ClassMember[]
  questions        Question[]
  sm2_progress     Sm2Progress[]
  quiz_sessions    QuizSession[]
  parent_links     ParentStudentLink[] @relation("Parent")
  student_links    ParentStudentLink[] @relation("Student")
  assignments      Assignment[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model Class {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  teacher_id  String    @db.Uuid
  name        String    @db.VarChar(100)
  subject     String    @db.VarChar(50)
  join_code   String    @unique @db.VarChar(10)
  description String?   @db.Text
  is_active   Boolean   @default(true)
  created_at  DateTime  @default(now()) @db.Timestamptz
  updated_at  DateTime  @default(now()) @updatedAt @db.Timestamptz
  deleted_at  DateTime? @db.Timestamptz

  teacher     User          @relation(fields: [teacher_id], references: [id], onDelete: Restrict)
  members     ClassMember[]
  assignments Assignment[]

  @@index([teacher_id])
  @@map("classes")
}

model ClassMember {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  class_id   String   @db.Uuid
  student_id String   @db.Uuid
  joined_at  DateTime @default(now()) @db.Timestamptz
  is_active  Boolean  @default(true)

  class      Class    @relation(fields: [class_id], references: [id], onDelete: Cascade)
  student    User     @relation(fields: [student_id], references: [id], onDelete: Cascade)

  @@unique([class_id, student_id])
  @@index([class_id])
  @@index([student_id])
  @@map("class_members")
}

model Question {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_by    String    @db.Uuid
  content       String    @db.Text
  question_type String    @db.VarChar(30)
  topic         String?   @db.VarChar(100)
  difficulty    Int       @default(3) @db.SmallInt
  explanation   String?   @db.Text
  audio_url     String?   @db.VarChar(500)
  image_url     String?   @db.VarChar(500)
  is_public     Boolean   @default(false)
  created_at    DateTime  @default(now()) @db.Timestamptz
  updated_at    DateTime  @default(now()) @updatedAt @db.Timestamptz
  deleted_at    DateTime? @db.Timestamptz

  author               User                 @relation(fields: [created_by], references: [id], onDelete: Restrict)
  answer_options       AnswerOption[]
  assignment_questions AssignmentQuestion[]
  sm2_progress         Sm2Progress[]
  session_answers      SessionAnswer[]

  @@index([created_by])
  @@index([topic])
  @@index([difficulty])
  @@map("questions")
}

model AnswerOption {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  question_id String   @db.Uuid
  content     String   @db.Text
  is_correct  Boolean  @default(false)
  order_index Int      @default(0) @db.SmallInt
  created_at  DateTime @default(now()) @db.Timestamptz

  question        Question        @relation(fields: [question_id], references: [id], onDelete: Cascade)
  session_answers SessionAnswer[]

  @@index([question_id])
  @@map("answer_options")
}

model Assignment {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  class_id     String    @db.Uuid
  created_by   String    @db.Uuid
  title        String    @db.VarChar(200)
  description  String?   @db.Text
  mode         String    @default("adaptive") @db.VarChar(20)
  deadline     DateTime? @db.Timestamptz
  max_attempts Int       @default(0) @db.SmallInt
  time_limit   Int?      @db.SmallInt
  is_published Boolean   @default(false)
  published_at DateTime? @db.Timestamptz
  created_at   DateTime  @default(now()) @db.Timestamptz
  updated_at   DateTime  @default(now()) @updatedAt @db.Timestamptz
  deleted_at   DateTime? @db.Timestamptz

  class                Class                @relation(fields: [class_id], references: [id], onDelete: Cascade)
  author               User                 @relation(fields: [created_by], references: [id], onDelete: Restrict)
  assignment_questions AssignmentQuestion[]
  quiz_sessions        QuizSession[]

  @@index([class_id])
  @@index([created_by])
  @@map("assignments")
}

model AssignmentQuestion {
  id            String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  assignment_id String @db.Uuid
  question_id   String @db.Uuid
  order_index   Int    @default(0) @db.SmallInt

  assignment Assignment @relation(fields: [assignment_id], references: [id], onDelete: Cascade)
  question   Question   @relation(fields: [question_id], references: [id], onDelete: Restrict)

  @@unique([assignment_id, question_id])
  @@index([assignment_id])
  @@index([question_id])
  @@map("assignment_questions")
}

model Sm2Progress {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  student_id       String    @db.Uuid
  question_id      String    @db.Uuid
  easiness_factor  Decimal   @default(2.50) @db.Decimal(4, 2)
  interval_days    Int       @default(1) @db.SmallInt
  repetition_count Int       @default(0) @db.SmallInt
  next_review_date DateTime  @default(dbgenerated("CURRENT_DATE")) @db.Date
  last_reviewed_at DateTime? @db.Timestamptz
  total_attempts   Int       @default(0)
  correct_attempts Int       @default(0)
  created_at       DateTime  @default(now()) @db.Timestamptz
  updated_at       DateTime  @default(now()) @updatedAt @db.Timestamptz

  student  User     @relation(fields: [student_id], references: [id], onDelete: Cascade)
  question Question @relation(fields: [question_id], references: [id], onDelete: Cascade)

  @@unique([student_id, question_id])
  @@index([student_id])
  @@index([student_id, next_review_date])
  @@index([question_id])
  @@map("sm2_progress")
}

model QuizSession {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  student_id    String    @db.Uuid
  assignment_id String    @db.Uuid
  started_at    DateTime  @default(now()) @db.Timestamptz
  finished_at   DateTime? @db.Timestamptz
  score         Decimal?  @db.Decimal(5, 2)
  total_q       Int       @default(0) @db.SmallInt
  correct_q     Int       @default(0) @db.SmallInt
  status        String    @default("in_progress") @db.VarChar(20)

  student         User            @relation(fields: [student_id], references: [id], onDelete: Cascade)
  assignment      Assignment      @relation(fields: [assignment_id], references: [id], onDelete: Cascade)
  session_answers SessionAnswer[]

  @@index([student_id])
  @@index([assignment_id])
  @@index([started_at])
  @@map("quiz_sessions")
}

model SessionAnswer {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  session_id       String   @db.Uuid
  question_id      String   @db.Uuid
  selected_option  String?  @db.Uuid
  text_answer      String?  @db.Text
  is_correct       Boolean
  response_time_ms Int      @default(0)
  sm2_quality      Int      @default(0) @db.SmallInt
  answered_at      DateTime @default(now()) @db.Timestamptz

  session QuizSession   @relation(fields: [session_id], references: [id], onDelete: Cascade)
  question Question     @relation(fields: [question_id], references: [id], onDelete: Restrict)
  option   AnswerOption? @relation(fields: [selected_option], references: [id], onDelete: SetNull)

  @@index([session_id])
  @@index([question_id])
  @@map("session_answers")
}

model ParentStudentLink {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  parent_id  String   @db.Uuid
  student_id String   @db.Uuid
  linked_at  DateTime @default(now()) @db.Timestamptz
  is_active  Boolean  @default(true)

  parent  User @relation("Parent", fields: [parent_id], references: [id], onDelete: Cascade)
  student User @relation("Student", fields: [student_id], references: [id], onDelete: Cascade)

  @@unique([parent_id, student_id])
  @@index([parent_id])
  @@index([student_id])
  @@map("parent_student_links")
}
```

**Step 4: Run test to verify it passes**
Run: `cd apps/api && npx prisma validate`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/api/package.json apps/api/prisma
git commit -m "feat(api): define full prisma database schema"
```

---

### Task 4: Setup Types Package

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/sm2.types.ts`
- Create: `packages/types/src/index.ts`

**Step 1: Write the failing test**
(Skipped for pure type definition)

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
Create `packages/types/package.json`:
```json
{
  "name": "@adaptive-lang/types",
  "version": "1.0.0",
  "main": "src/index.ts"
}
```

Create `packages/types/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

Create `packages/types/src/sm2.types.ts`:
```typescript
export interface SM2Progress {
  easiness_factor: number;    
  interval_days: number;      
  repetition_count: number;   
}

export interface SM2Input {
  progress: SM2Progress | null;   
  is_correct: boolean;
  response_time_ms: number;
}

export interface SM2Result {
  q: number;                     
  new_ef: number;                
  new_interval: number;          
  new_repetition_count: number;  
  next_review_date: Date;        
}

export const SM2_DEFAULTS: SM2Progress = {
  easiness_factor: 2.5,
  interval_days: 1,
  repetition_count: 0,
} as const;

export const SM2_CONSTANTS = {
  EF_MIN: 1.3,
  EF_MAX: 5.0,
  EF_DEFAULT: 2.5,
  RESPONSE_FAST_MS: 5_000,    
  RESPONSE_MEDIUM_MS: 15_000, 
  RESPONSE_SLOW_WRONG_MS: 20_000, 
} as const;
```

Create `packages/types/src/index.ts`:
```typescript
export * from './sm2.types';
```

**Step 4: Run test to verify it passes**
Run: `cd packages/types && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**
```bash
git add packages/types
git commit -m "feat(types): add shared types package and sm2 interfaces"
```

---

### Task 5: Setup SM2 Engine Package & Jest

**Files:**
- Create: `packages/sm2-engine/package.json`
- Create: `packages/sm2-engine/tsconfig.json`
- Create: `packages/sm2-engine/jest.config.js`

**Step 1: Write the failing test**
Run: `cd packages/sm2-engine && npm test`
Expected: FAIL (no test script or jest config)

**Step 2: Run test to verify it fails**
(See above)

**Step 3: Write minimal implementation**
Create `packages/sm2-engine/package.json`:
```json
{
  "name": "@adaptive-lang/sm2-engine",
  "version": "1.0.0",
  "main": "src/sm2.ts",
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@adaptive-lang/types": "*"
  }
}
```

Create `packages/sm2-engine/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

Create `packages/sm2-engine/jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts']
};
```

Run: `cd packages/sm2-engine && npm install`

**Step 4: Run test to verify it passes**
Run: `cd packages/sm2-engine && npm test`
Expected: FAIL (No tests found - this is correct for Jest when empty).

**Step 5: Commit**
```bash
git add packages/sm2-engine/package.json packages/sm2-engine/tsconfig.json packages/sm2-engine/jest.config.js
git commit -m "chore(sm2): setup package and jest testing environment"
```

---

### Task 6: SM2 Engine - Calculate Quality Score

**Files:**
- Create: `packages/sm2-engine/src/sm2.ts`
- Create: `packages/sm2-engine/src/__tests__/quality-score.test.ts`

**Step 1: Write the failing test**
Create `packages/sm2-engine/src/__tests__/quality-score.test.ts`:
```typescript
import { calculateQualityScore } from '../sm2';

describe('calculateQualityScore', () => {
  describe('khi trả lời ĐÚNG', () => {
    it('trả về q=5 khi trả lời nhanh (< 5 giây)', () => {
      expect(calculateQualityScore(true, 2000)).toBe(5);
      expect(calculateQualityScore(true, 4999)).toBe(5);
    });
    it('trả về q=4 khi trả lời vừa phải (5–15 giây)', () => {
      expect(calculateQualityScore(true, 5000)).toBe(4);
      expect(calculateQualityScore(true, 14999)).toBe(4);
    });
    it('trả về q=3 khi trả lời chậm (≥ 15 giây)', () => {
      expect(calculateQualityScore(true, 15000)).toBe(3);
    });
    it('trả về q=0 khi response_time_ms = 0 (timeout)', () => {
      expect(calculateQualityScore(true, 0)).toBe(0);
    });
  });

  describe('khi trả lời SAI', () => {
    it('trả về q=1 khi trả lời nhanh (chọn sai không do thiếu thời gian)', () => {
      expect(calculateQualityScore(false, 3000)).toBe(1);
      expect(calculateQualityScore(false, 19999)).toBe(1);
    });
    it('trả về q=2 khi trả lời rất chậm rồi sai (> 20 giây — có dấu hiệu cố nhớ)', () => {
      expect(calculateQualityScore(false, 20001)).toBe(2);
    });
  });
});
```

Create empty `packages/sm2-engine/src/sm2.ts` exporting dummy function:
```typescript
export function calculateQualityScore(is_correct: boolean, response_time_ms: number): number { return -1; }
```

**Step 2: Run test to verify it fails**
Run: `cd packages/sm2-engine && npm test`
Expected: FAIL 

**Step 3: Write minimal implementation**
Update `packages/sm2-engine/src/sm2.ts`:
```typescript
import { SM2_CONSTANTS } from '@adaptive-lang/types';

export function calculateQualityScore(is_correct: boolean, response_time_ms: number): number {
  const t = Math.max(0, response_time_ms);

  if (!is_correct) {
    return t > SM2_CONSTANTS.RESPONSE_SLOW_WRONG_MS ? 2 : 1;
  }

  if (t === 0) return 0; // timeout / không trả lời

  if (t < SM2_CONSTANTS.RESPONSE_FAST_MS) return 5;
  if (t < SM2_CONSTANTS.RESPONSE_MEDIUM_MS) return 4;
  return 3;
}
```

**Step 4: Run test to verify it passes**
Run: `cd packages/sm2-engine && npm test`
Expected: PASS

**Step 5: Commit**
```bash
git add packages/sm2-engine/src/sm2.ts packages/sm2-engine/src/__tests__/quality-score.test.ts
git commit -m "feat(sm2): implement and test calculateQualityScore"
```

---

### Task 7: SM2 Engine - Update Easiness Factor

**Files:**
- Modify: `packages/sm2-engine/src/sm2.ts`
- Create: `packages/sm2-engine/src/__tests__/easiness-factor.test.ts`

**Step 1: Write the failing test**
Create `packages/sm2-engine/src/__tests__/easiness-factor.test.ts`:
```typescript
import { updateEasinessFactor } from '../sm2';

describe('updateEasinessFactor', () => {
  it('q=5: EF tăng +0.10', () => {
    expect(updateEasinessFactor(2.5, 5)).toBeCloseTo(2.6, 2);
  });
  it('q=4: EF không thay đổi', () => {
    expect(updateEasinessFactor(2.5, 4)).toBeCloseTo(2.5, 2);
  });
  it('q=3: EF giảm -0.14', () => {
    expect(updateEasinessFactor(2.5, 3)).toBeCloseTo(2.36, 2);
  });
  it('q=1: EF giảm -0.54', () => {
    expect(updateEasinessFactor(2.5, 1)).toBeCloseTo(1.96, 2);
  });
  it('không nhỏ hơn 1.30', () => {
    expect(updateEasinessFactor(1.30, 0)).toBe(1.30);
  });
});
```

Add dummy to `sm2.ts`:
```typescript
export function updateEasinessFactor(current_ef: number, q: number): number { return -1; }
```

**Step 2: Run test to verify it fails**
Run: `cd packages/sm2-engine && npm test`
Expected: FAIL

**Step 3: Write minimal implementation**
Update `updateEasinessFactor` in `sm2.ts`:
```typescript
export function updateEasinessFactor(current_ef: number, q: number): number {
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const raw = current_ef + delta;
  const clamped = Math.max(SM2_CONSTANTS.EF_MIN, Math.min(SM2_CONSTANTS.EF_MAX, raw));
  return Math.round(clamped * 100) / 100;
}
```

**Step 4: Run test to verify it passes**
Run: `cd packages/sm2-engine && npm test`
Expected: PASS

**Step 5: Commit**
```bash
git add packages/sm2-engine/src/sm2.ts packages/sm2-engine/src/__tests__/easiness-factor.test.ts
git commit -m "feat(sm2): implement updateEasinessFactor logic"
```

---

### Task 8: SM2 Engine - Calculate Next Interval & UpdateSM2

**Files:**
- Modify: `packages/sm2-engine/src/sm2.ts`
- Create: `packages/sm2-engine/src/__tests__/update-sm2.test.ts`

**Step 1: Write the failing test**
Create `packages/sm2-engine/src/__tests__/update-sm2.test.ts`:
```typescript
import { updateSM2 } from '../sm2';

describe('updateSM2', () => {
  it('cập nhật đúng cho câu trả lời tốt', () => {
    const result = updateSM2({
      progress: { easiness_factor: 2.5, interval_days: 1, repetition_count: 0 },
      is_correct: true,
      response_time_ms: 2000
    }, new Date('2025-10-01T00:00:00Z'));
    
    expect(result.q).toBe(5);
    expect(result.new_ef).toBe(2.6);
    expect(result.new_interval).toBe(1);
    expect(result.new_repetition_count).toBe(1);
    expect(result.next_review_date.toISOString().startsWith('2025-10-02')).toBe(true);
  });

  it('reset tiến độ nếu sai', () => {
    const result = updateSM2({
      progress: { easiness_factor: 2.5, interval_days: 12, repetition_count: 4 },
      is_correct: false,
      response_time_ms: 3000
    }, new Date('2025-10-01T00:00:00Z'));
    
    expect(result.q).toBe(1);
    expect(result.new_interval).toBe(1);
    expect(result.new_repetition_count).toBe(0);
  });
});
```

Add dummy to `sm2.ts`:
```typescript
import { SM2Input, SM2Result, SM2_DEFAULTS } from '@adaptive-lang/types';

export function calculateNextInterval(current_interval: number, repetition_count: number, new_ef: number, q: number) { 
  return { new_interval: -1, new_repetition_count: -1 }; 
}
export function addDays(base: Date, days: number): Date { return new Date(); }
export function updateSM2(input: SM2Input, today: Date = new Date()): SM2Result { 
  return { q: 0, new_ef: 0, new_interval: 0, new_repetition_count: 0, next_review_date: new Date() }; 
}
```

**Step 2: Run test to verify it fails**
Run: `cd packages/sm2-engine && npm test`
Expected: FAIL

**Step 3: Write minimal implementation**
Update `sm2.ts`:
```typescript
export function calculateNextInterval(
  current_interval: number,
  repetition_count: number,
  new_ef: number, 
  q: number,
): { new_interval: number; new_repetition_count: number } {
  if (q < 3) return { new_interval: 1, new_repetition_count: 0 };
  let new_interval: number;
  if (repetition_count === 0) new_interval = 1;
  else if (repetition_count === 1) new_interval = 6;
  else new_interval = Math.max(Math.round(current_interval * new_ef), current_interval + 1);
  return { new_interval, new_repetition_count: repetition_count + 1 };
}

export function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setUTCDate(result.getUTCDate() + days);
  result.setUTCHours(0, 0, 0, 0); 
  return result;
}

export function updateSM2(input: SM2Input, today: Date = new Date()): SM2Result {
  const progress = input.progress ?? SM2_DEFAULTS;
  const q = calculateQualityScore(input.is_correct, input.response_time_ms);
  const new_ef = updateEasinessFactor(progress.easiness_factor, q);
  const { new_interval, new_repetition_count } = calculateNextInterval(
    progress.interval_days, progress.repetition_count, new_ef, q
  );
  
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const next_review_date = addDays(todayUTC, new_interval);

  return { q, new_ef, new_interval, new_repetition_count, next_review_date };
}
```

**Step 4: Run test to verify it passes**
Run: `cd packages/sm2-engine && npm test`
Expected: PASS

**Step 5: Commit**
```bash
git add packages/sm2-engine/src/sm2.ts packages/sm2-engine/src/__tests__/update-sm2.test.ts
git commit -m "feat(sm2): implement updateSM2 and calculateNextInterval logic"
```
