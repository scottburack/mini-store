# Context: Guided Build of a Next.js + NestJS + Prisma + Supabase Ecommerce App, Deployed on AWS

Paste or attach this file at the start of a Claude session. It tells Claude how to walk me through building the app, step by step, with code I can copy.

---

## 1. Purpose

I'm preparing for a full-stack TypeScript interview (Next.js and NestJS). I want to build a small ecommerce app with a cart, start to finish, using Prisma for the database layer, Supabase as the hosted Postgres, and an AWS server to run it. I want to end up with a working, deployed app and understand why every piece is written the way it is, so I can explain it.

## 2. How Claude should guide me

- **Give me the code.** Every step should include complete, copy-pasteable code: full files or clearly marked additions, with the file path above each block. No "left as an exercise", no pseudo-code, no `// ...rest of file` in files I need to paste whole.
- **Give me commands too.** Install commands, migration commands, run commands, server commands, in the order I should run them.
- **Explain after the code, briefly.** For each file or block: what it does and why it's written this way. Call out the non-obvious decisions (transactions, constraints, guards, caching, connection pooling, server hardening) in a few sentences, not an essay.
- **One slice at a time.** Finish a slice, give me a way to verify it (curl commands, a test, or something to click), and wait for me to say it works or paste an error before moving on.
- **Debug with me.** If I paste an error or output, diagnose it and give the corrected code or command.
- **Skip ecommerce basics.** I'm a senior Shopify Plus developer. I know carts, SKUs, inventory and checkout flows. Spend the explanation on NestJS, Prisma, Supabase, AWS and Next.js specifics.
- **Flag interview-worthy points.** After each slice, add a short "Be ready to explain" list (3 to 5 bullets) of the decisions I should be able to defend.
- **Keep it current.** Use current stable versions of Next.js (App Router), NestJS, Prisma, Node LTS and the Supabase and AWS consoles. If an API or config format changed recently (for example how Prisma configures connection URLs), use the current one and say so.
- **Be direct about better approaches.** If I ask for something that would be a red flag in code review, say so and show the better way.

## 3. The app: "Mini Store"

A single-tenant online store.

**Customer features**
- Browse products, view a product detail page
- Add to cart, change quantity, remove from cart
- Cart persists (guest cart via cookie or token, merged into the account cart on login)
- Checkout: converts the cart into an order, decrementing stock
- View order history

**Admin features (keep minimal)**
- Create and edit products and stock levels

**Out of scope:** real payments (use a fake payment status field), shipping rates, tax, emails, search, reviews. Product images are plain URLs (Supabase Storage is an optional stretch).

## 4. Stack and conventions

- **Monorepo:** `apps/api` (NestJS) and `apps/web` (Next.js App Router), npm workspaces (root `package.json` has `"workspaces": ["apps/*"]`; run app scripts with `npm run <script> -w api` / `-w web`).
- **Database:** Supabase-hosted PostgreSQL, accessed only through Prisma, wrapped in a `PrismaService` in the API app. I do not use the Supabase JS client for data access; Nest is the single gateway to the database.
- **Connection strings:** two of them.
  - `DATABASE_URL`: the Supabase pooled (Supavisor, transaction mode) connection, used by the running app. Include the parameters Prisma needs for pgbouncer-style pooling.
  - `DIRECT_URL`: the direct (or session-mode) connection, used only by `prisma migrate`.
  - Claude should show exactly where to find both in the Supabase dashboard and how to wire them into Prisma using the current config style.
- **Row Level Security:** Prisma connects with a privileged role and bypasses RLS, but Supabase also exposes tables through its auto-generated Data API. So enable RLS on every table (with no policies) via a raw SQL migration, which locks out the public API keys while Prisma keeps working.
- **Auth:** custom JWT in an httpOnly cookie, issued by Nest, guard-based. Passwords hashed with argon2. (Supabase Auth is a possible alternative; use it only if I ask.)
- **Validation:** `class-validator` + `class-transformer` DTOs on every endpoint, global `ValidationPipe` with `whitelist: true`.
- **Money:** integers in cents everywhere.
- **Layering:** controller (HTTP only) -> service (business logic) -> Prisma. No Prisma calls in controllers.
- **Errors:** services throw Nest `HttpException` subclasses.
- **Web:** Server Components for reads (product list/detail, order history), Client Components only where interaction is needed (cart buttons). Server Actions or route handlers call the API.
- **Hosting (AWS):** one EC2 instance (Ubuntu LTS, small instance size) running both apps in Docker Compose behind nginx as a reverse proxy, with HTTPS from Let's Encrypt. The database stays on Supabase, so the server is stateless. Alternatives to mention briefly in the final slice (not build): ECS Fargate, App Runner, Elastic Beanstalk.
- **Containers:** a multi-stage `Dockerfile` for each app (build stage, slim runtime stage, non-root user), plus a `docker-compose.yml` and `.dockerignore`.
- **Local dev:** run both apps directly with npm against a Supabase project (free tier). Docker is only needed for the deploy slice.
- **Testing:** Vitest (the NestJS 12 scaffold default; `vitest.config.ts` for unit tests, `vitest.config.e2e.ts` for e2e). Service tests for cart and checkout, one e2e test for the checkout happy path, run against a separate Supabase project or schema so tests never touch dev data.

## 5. Data model

Models: `User`, `Product`, `Cart`, `CartItem`, `Order`, `OrderItem`.

Claude should write the full `schema.prisma` and explain these choices:
- `price` as `Int` (cents); `OrderItem` snapshots `unitPrice` and product name at purchase time
- `CartItem` has `@@unique([cartId, productId])` so adding an existing item increments quantity
- `Product.stock` as `Int`, never allowed to go negative (enforced in code, plus a DB check constraint via a raw SQL migration)
- `Order.status` as an enum (`PENDING`, `PAID`, `CANCELLED`)
- Indexes on foreign keys and on `Order(userId, createdAt)`
- Deliberate `onDelete` behavior on every relation
- RLS enabled on all tables via a raw SQL migration

## 6. Build plan: vertical slices

For each slice, Claude provides the code, commands, a verification step, and a "Be ready to explain" list.

**Slice 0: Setup**
- Monorepo, Nest app, Next app, create the Supabase project, grab both connection strings, env handling, Prisma init, `PrismaService`, `GET /health` that runs a trivial query
- Verify: `/health` responds and hits the database; `prisma migrate dev` runs cleanly against Supabase
- Explain: pooled vs direct connections, why migrations need the direct URL

**Slice 1: Products**
- Schema + migration (including RLS and the stock check constraint as raw SQL), seed script, `ProductsModule` (list with pagination, get by id)
- Next.js product list and detail pages (Server Components)
- Verify: seeded products render and are visible in the Supabase table editor; unknown id returns 404; the anon key cannot read tables through the Data API
- Explain: RLS vs Prisma's privileged role

**Slice 2: Auth**
- Register, login, logout, `GET /me`, JWT guard, current-user decorator, cookie handling between Next and Nest (CORS, credentials)
- Verify: protected route rejects unauthenticated requests; password hash never returned

**Slice 3: Cart**
- Endpoints: get cart, add item, update quantity, remove item
- Guest cart via cookie/token, merge into user cart on login
- Verify: adding the same product twice increments quantity; quantity can't exceed stock; totals are computed on the server
- Next.js: cart page and add-to-cart button (Client Component calling a Server Action)

**Slice 4: Checkout (the core slice)**
- Convert cart to order inside one `prisma.$transaction`: re-validate stock, decrement stock, create order + items with price snapshots, clear cart
- Prevent overselling when two buyers race for the last unit (conditional `updateMany` where `stock >= qty`, with the alternative of `SELECT ... FOR UPDATE` explained)
- Idempotency key so a retried checkout doesn't create a second order
- Verify: a concurrent checkout test can't oversell; a failed checkout leaves stock and cart unchanged
- Explain: how interactive transactions behave through the transaction-mode pooler, and keeping them short

**Slice 5: Orders and admin**
- Order history scoped to the current user; admin product create/edit behind a role guard
- Verify: requesting another user's order returns 404; non-admin can't hit admin routes

**Slice 6: Polish**
- Global exception filter, request logging, rate limiting on auth routes (`@nestjs/throttler`), Swagger docs, README with an architecture overview
- Verify: full flow works end to end from a fresh database

**Slice 7: Deploy to AWS**
- Dockerfiles and `docker-compose.yml` for api and web; a `/health` check wired into Compose
- AWS setup, step by step in the console (or CLI where easier): launch the EC2 instance, key pair, security group (22 restricted to my IP, 80 and 443 open), Elastic IP, install Docker, clone the repo, production `.env` handling (no secrets in git)
- nginx reverse proxy config (web on `/`, api on `/api` or a subdomain), domain DNS record, Let's Encrypt certificate with auto-renewal
- Run `prisma migrate deploy` (not `migrate dev`) as part of the deploy, then start the stack
- A simple repeatable redeploy script (pull, build, migrate, restart); optionally a GitHub Actions workflow that does it over SSH
- Verify: site loads over HTTPS, full cart-to-checkout flow works against the deployed server, containers restart after a reboot
- Explain: security groups vs firewall, why 22 is locked down, secrets handling, `migrate deploy` vs `migrate dev`, and the tradeoffs of EC2 vs ECS Fargate vs App Runner
- Optional stretch: Supabase Storage for product images

## 7. Prisma, Supabase and AWS points to include where relevant

- One `PrismaClient` instance via the Nest provider, with shutdown hooks
- Pooled vs direct connection strings, and what breaks if they're mixed up
- `include` vs `select` and avoiding over-fetching / N+1
- Interactive vs batch `$transaction`, and keeping transactions short
- Why read-then-write is unsafe under concurrency
- Migrations: never edit an applied migration; how to add raw SQL (RLS, check constraints)
- Idempotent seeding
- Free-tier gotchas (Supabase project pausing and connection limits; AWS instance cost and a billing alert)
- Keeping the server cheap: stop or terminate the instance when I'm not using it, and set an AWS budget alert before launching anything

## 8. How to start

When I paste this file, Claude should:
1. Confirm the plan in two or three sentences.
2. Ask only what it needs: whether I've already created a Supabase project, whether I have an AWS account, and whether I own a domain (if not, use the instance's public DNS name over HTTP for the demo and explain what HTTPS would need).
3. Start with Slice 0 and give me the full code and commands.

If I come back later mid-build, I'll tell Claude which slice I'm on and what's working; continue from there rather than restarting.
