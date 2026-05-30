u # DailyBake Admin Dashboard — Complete Antigravity Prompt
> Copy and paste this entire prompt into Antigravity to build the full admin dashboard.

---

## MASTER PROMPT

```
You are building the complete admin dashboard for "The Daily Bake" — a B2C bakery and FMCG e-commerce store. Build everything in Next.js 14 (App Router) with TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, and PostgreSQL.

---

## DESIGN SYSTEM — FOLLOW EXACTLY

### Colors (use these CSS variables in globals.css):
--green: #3d5a2e
--green-dark: #1a2c1a
--green-light: #4d7a3e
--amber: #c8872a
--amber-light: #e8a845
--bg: #f0f2e8
--surface: #e8ead8
--border: #d4d9b8
--white: #ffffff
--text-head: #1a2c1a
--text-body: #4a4a4a
--text-muted: #8a8a7a

### Typography:
- Font: DM Sans (body), Playfair Display (headings)
- Headings: font-weight 900, uppercase, tight letter-spacing
- Body: font-weight 400, color #4a4a4a
- Labels: font-weight 700, uppercase, wide letter-spacing

### Components:
- Buttons: border-radius 4px, uppercase text, wide letter-spacing
- Cards: border-radius 8px, border 1px solid #d4d9b8, white background, NO box-shadow
- Badges: border-radius 999px (pill shape)
- Tables: clean borders, alternating row colors (#ffffff / #f5f5f5), green header (#1a2c1a text white)
- Sidebar: background #1a2c1a (dark green), white text, amber (#c8872a) active state
- Top bar: white background, border-bottom 1px solid #d4d9b8

---

## PROJECT STRUCTURE

Create this folder structure:
app/
├── (admin)/
│   └── admin/
│       ├── layout.tsx              ← Admin shell layout
│       ├── page.tsx                ← Overview dashboard
│       ├── products/
│       │   ├── page.tsx            ← Product list
│       │   └── [id]/page.tsx       ← Add/edit product
│       ├── orders/
│       │   ├── page.tsx            ← Order list
│       │   └── [id]/page.tsx       ← Order detail
│       ├── inventory/
│       │   └── page.tsx            ← Stock management
│       ├── customers/
│       │   └── page.tsx            ← Customer list
│       ├── coupons/
│       │   └── page.tsx            ← Coupon management
│       └── banners/
│           └── page.tsx            ← Banner management
components/
└── admin/
    ├── AdminSidebar.tsx
    ├── AdminTopBar.tsx
    ├── StatCard.tsx
    ├── RevenueChart.tsx
    ├── OrdersTable.tsx
    ├── ProductForm.tsx
    └── InventoryTable.tsx

---

## STEP 1 — ADMIN LAYOUT (app/(admin)/admin/layout.tsx)

Build a full-height admin shell with:

SIDEBAR (fixed left, 240px wide, background #1a2c1a):
- Top: Logo "THE DAILY BAKE™" in white Playfair Display font, "Admin Panel" subtitle in muted green
- Navigation links with icons (use lucide-react icons):
  • Overview → /admin (LayoutDashboard icon)
  • Products → /admin/products (Package icon)
  • Orders → /admin/orders (ShoppingCart icon)
  • Inventory → /admin/inventory (Boxes icon)
  • Customers → /admin/customers (Users icon)
  • Coupons → /admin/coupons (Tag icon)
  • Banners → /admin/banners (Image icon)
  • Settings → /admin/settings (Settings icon)
- Active link style: background rgba(200,135,42,0.15), left border 3px solid #c8872a, text #c8872a
- Hover style: background rgba(255,255,255,0.05), text white
- Bottom: Admin user avatar + name + logout button

TOP BAR (fixed top, full width minus sidebar, height 64px, white background):
- Left: Page title (dynamic based on current route)
- Right: Search input + notification bell icon (with badge) + admin avatar

MAIN CONTENT AREA:
- Left margin 240px, top margin 64px
- Background #f0f2e8
- Padding 32px

Make sidebar and topbar sticky. Main content scrolls independently.

---

## STEP 2 — OVERVIEW DASHBOARD (app/(admin)/admin/page.tsx)

Build a comprehensive analytics overview page.

KPI CARDS ROW (4 cards side by side):
Each card: white background, border 1px solid #d4d9b8, border-radius 8px, padding 20px

Card 1 — Total Revenue:
- Icon: IndianRupee (lucide), background #EAF3DE, color #3B6D11
- Value: ₹1,24,580
- Label: "Total Revenue"
- Delta: +18% vs last month (green arrow up)

Card 2 — Total Orders:
- Icon: ShoppingCart, background #E6F1FB, color #185FA5
- Value: 1,247
- Label: "Total Orders"
- Delta: +12% vs last month (green arrow up)

Card 3 — Total Customers:
- Icon: Users, background #FAEEDA, color #854F0B
- Value: 843
- Label: "Total Customers"
- Delta: +8% vs last month (green arrow up)

Card 4 — Avg Order Value:
- Icon: TrendingUp, background #EEEDFE, color #534AB7
- Value: ₹485
- Label: "Avg Order Value"
- Delta: -2% vs last month (red arrow down)

REVENUE CHART (below KPI cards):
- Use recharts LineChart
- Title: "Revenue Overview" with date range selector (7D / 30D / 90D toggle buttons)
- Line color: #3d5a2e
- Chart area fill: rgba(61,90,46,0.05)
- X-axis: dates, Y-axis: ₹ values
- Sample data for 30 days with realistic bakery revenue numbers (₹2,000–₹8,000 per day)
- White card background, padding 24px, border-radius 8px

TWO COLUMN SECTION below chart:

LEFT COLUMN — Recent Orders (60% width):
Table with columns: Order ID, Customer, Items, Total, Status, Date
Status badges (pill shape):
- pending: background #FAEEDA, color #854F0B
- confirmed: background #E6F1FB, color #185FA5
- shipped: background #EEEDFE, color #534AB7
- delivered: background #EAF3DE, color #3B6D11
- cancelled: background #FCEBEB, color #A32D2D
Show 5 recent orders with realistic bakery data
"View all orders" link at bottom → /admin/orders

RIGHT COLUMN — Low Stock Alerts (40% width):
Title with red alert badge showing count
List of products with stock < 10:
- Product name + variant
- Current stock (red if < 5, amber if < 10)
- "Update Stock" button (outline green button)
Show 5 items

BOTTOM ROW:
Left — Top Products (bar chart using recharts, top 5 products by revenue)
Right — Order Status Distribution (pie/donut chart using recharts, 5 status colors)

---

## STEP 3 — PRODUCT MANAGEMENT (app/(admin)/admin/products/page.tsx)

HEADER ROW:
- Left: "Products" heading + "(77 products)" count badge
- Right: "Add Product" button (green primary button with Plus icon)

FILTER/SEARCH BAR:
- Search input with Search icon (placeholder: "Search products...")
- Category dropdown filter
- Status filter (All / Active / Inactive)
- Sort dropdown (Newest / Oldest / Price High / Price Low)

PRODUCTS TABLE:
Columns: Image (40x40px thumbnail) | Name + SKU | Category | Variants | Price | Stock | Status | Actions

For each row:
- Image: small rounded square, emoji placeholder if no image
- Name: bold, dark text. SKU: small muted text below
- Category badge (pill, green surface)
- Variants count (e.g. "3 variants")
- Price: ₹XX – ₹XX range
- Stock: green if >10, amber if 5-10, red if <5, with exact number
- Status: Active (green pill) / Inactive (gray pill) toggle switch
- Actions: Edit button (pencil icon) + Delete button (trash icon, red hover)

Show 8 sample products: Multigrain Sourdough, Olive Rosemary Bread, Butter Chocolate Brownie, Cold Pressed Coconut Oil, Oat Honey Cookies, Whole Wheat Croissant, Protein Granola Mix, Mango Chiffon Cake

Pagination at bottom: Previous / 1 2 3 ... 9 / Next

---

## STEP 4 — ADD/EDIT PRODUCT FORM (app/(admin)/admin/products/[id]/page.tsx)

Full-width form layout with two columns:

LEFT COLUMN (60%):

Section 1 — Basic Info:
- Product Name (text input)
- Slug (auto-generated from name, editable)
- Description (textarea, 4 rows)
- Category (select dropdown: Breads & Loaves / Cakes & Pastries / FMCG Essentials / Snacks & Cookies)
- Status toggle (Active / Inactive)

Section 2 — Product Variants:
Title: "Variants" + "Add Variant" button
Variant table with columns: Label | Price (₹) | Stock | SKU | Actions
- Label: e.g. "400g", "800g", "6 pcs"
- Each variant row is editable inline
- "Add row" button adds new empty variant row
- Delete row with X button

Section 3 — Nutritional Tags:
Checkbox group: Zero Maida | High Protein | Vegan | Gluten Free | Sugar Free | No Preservatives | Fresh Baked

RIGHT COLUMN (40%):

Section 4 — Product Images:
- Large upload area (dashed border, #d4d9b8, border-radius 8px)
- Upload icon + "Drop images here or click to upload"
- "Images upload to Cloudflare R2"
- Show uploaded image thumbnails in a 2-column grid with remove X button

Section 5 — SEO:
- Meta title input
- Meta description textarea

Section 6 — Pricing Summary (read-only card):
- Price range (from variants)
- Total stock (sum of variants)
- Number of active variants

BOTTOM ACTION BAR (sticky at bottom of form):
- Left: "Cancel" (outline button) + "Save as Draft" (outline button)
- Right: "Publish Product" (green primary button)

---

## STEP 5 — ORDER MANAGEMENT (app/(admin)/admin/orders/page.tsx)

HEADER: "Orders" heading + export CSV button (right)

STATS STRIP (4 small cards inline):
- Today's orders: 24
- Pending: 8 (amber)
- Shipped: 12 (blue)
- Delivered today: 47 (green)

FILTER BAR:
- Search (Order ID or customer name)
- Status filter tabs: All | Pending | Confirmed | Shipped | Delivered | Cancelled
- Date range picker (Today / This Week / This Month / Custom)
- Payment method filter (All / UPI / Card / COD)

ORDERS TABLE:
Columns: Order ID | Customer | Date | Items | Total | Payment | Status | Actions

- Order ID: #ORD-1234 in green monospace
- Customer: avatar initial + name + phone
- Date: "Today, 2:34 PM" format
- Items: "3 items" with tooltip showing item names
- Total: ₹XXX bold
- Payment: UPI (blue badge) / Card (purple badge) / COD (amber badge)
- Status: colored badge (same colors as overview)
- Actions: View button (eye icon) + Update Status (pencil icon)

Show 8 sample orders with realistic data.
Row click → opens order detail

---

## STEP 6 — ORDER DETAIL (app/(admin)/admin/orders/[id]/page.tsx)

TWO COLUMN LAYOUT:

LEFT (65%):

Order Header Card:
- Order #ORD-1247 (large, bold)
- Placed: "12 May 2026, 2:34 PM"
- Current status badge (large)
- Payment status badge

Order Items Table:
- Columns: Product | Variant | Qty | Unit Price | Total
- Product thumbnail (40x40) + name + category badge
- Subtotal, Delivery charge, Coupon discount, Grand Total rows at bottom

Order Timeline (vertical stepper):
Steps: Order Placed → Confirmed → Preparing → Shipped → Delivered
- Completed steps: filled green circle with checkmark
- Current step: pulsing green circle
- Pending steps: gray empty circle
- Each step shows timestamp when completed

RIGHT (35%):

Customer Info Card:
- Avatar (large initial circle, green background)
- Customer name + email + phone
- "View Customer" link

Delivery Address Card:
- Full address with pin icon
- Google Maps link

Payment Card:
- Method: UPI/Card/COD
- Razorpay Payment ID
- Status: Paid / Pending / Failed

Update Order Card:
- Status dropdown (select new status)
- Tracking number input (text field)
- Note to customer (textarea)
- "Update Order" green button

---

## STEP 7 — INVENTORY MANAGEMENT (app/(admin)/admin/inventory/page.tsx)

HEADER: "Inventory" + "Bulk Update" button (CSV upload icon)

ALERT BANNER (if any low stock):
Red/amber banner: "8 products are running low on stock" with "View All" link

FILTER ROW:
- Search products
- Category filter
- Stock filter: All / In Stock / Low Stock (<10) / Out of Stock

INVENTORY TABLE:
Columns: Product | Variant | SKU | Current Stock | Threshold | Status | Adjustment | Last Updated

- Product: thumbnail + name
- Stock number: color coded (green >10, amber 5-10, red <5, gray 0)
- Status pill: In Stock / Low Stock / Out of Stock
- Adjustment: inline +/- buttons with number input (update stock directly)
- Save button appears when value changes (green small button)

BULK UPDATE SECTION (collapsible):
- CSV template download link
- CSV upload dropzone
- "Apply Bulk Update" button

---

## STEP 8 — CUSTOMER MANAGEMENT (app/(admin)/admin/customers/page.tsx)

HEADER: "Customers" + total count

STATS ROW (3 cards):
- Total Customers: 843
- New This Month: 127
- Repeat Customers: 412 (49%)

FILTER/SEARCH:
- Search (name, email, phone)
- Segment filter: All / New (1 order) / Repeat (2-5 orders) / Loyal (6+ orders)
- Sort: Recent / Most Orders / Highest Spend

CUSTOMERS TABLE:
Columns: Customer | Contact | Orders | Total Spend | Last Order | Segment | Actions

- Customer: avatar initial circle + name + join date
- Contact: email + phone (small, muted)
- Orders: count badge
- Total Spend: ₹XXX bold green
- Last Order: relative time ("3 days ago")
- Segment badge: New (blue) / Repeat (amber) / Loyal (green)
- Actions: View Profile button

CUSTOMER PROFILE DRAWER (slides in from right on row click):
- Large avatar + name + contact info
- 3 stat cards: Total Orders, Total Spend, Avg Order Value
- Recent Orders list (last 5)
- Addresses list
- Account created date

---

## STEP 9 — COUPON MANAGEMENT (app/(admin)/admin/coupons/page.tsx)

HEADER: "Coupons & Discounts" + "Create Coupon" button

STATS (3 cards):
- Active Coupons: 8
- Total Redemptions: 342
- Revenue from Coupons: ₹18,430

COUPONS TABLE:
Columns: Code | Type | Value | Min Order | Uses | Expiry | Status | Actions

- Code: monospace green text (e.g. FRESHBAKE)
- Type: Percentage (%) or Fixed Amount (₹) badge
- Value: e.g. "10%" or "₹50"
- Min Order: ₹XXX
- Uses: "124 / 500" with progress bar
- Expiry: date, red if expired
- Status: Active (green toggle) / Inactive (gray toggle)
- Actions: Edit + Delete

CREATE/EDIT COUPON MODAL:
- Coupon Code (text input + "Generate Random" button)
- Discount Type: radio (Percentage / Fixed Amount)
- Discount Value (number input)
- Minimum Order Value (number input)
- Maximum Uses (number input)
- Per Customer Limit (toggle + number input)
- Expiry Date (date picker)
- Active toggle
- "Save Coupon" green button

---

## STEP 10 — BANNER MANAGEMENT (app/(admin)/admin/banners/page.tsx)

HEADER: "Banners & Content" + "Add Banner" button

BANNER CARDS GRID (2 per row):
Each banner card:
- Preview image (full width, 160px height, border-radius 8px)
- Title + position label (Hero / Announcement / Featured)
- Date range: "12 May – 30 May 2026"
- Status toggle: Active / Inactive
- Edit + Delete action buttons

ADD/EDIT BANNER FORM (below grid):
- Title (text input)
- Position: Hero Banner / Announcement Bar / Featured Section (select)
- Image Upload: drop zone → uploads to Cloudflare R2
- Link URL (text input, optional)
- Start Date + End Date (date inputs)
- Active toggle
- "Save & Publish" green button (triggers Next.js revalidatePath)

ANNOUNCEMENT BAR EDITOR (separate card):
- Current announcement bar text (editable inline)
- Character count
- Highlight text (e.g. "FRESHBAKE" shown in amber)
- "Update Live" button

---

## TECHNICAL REQUIREMENTS

1. DATABASE CONNECTION:
Use this in lib/prisma.ts:
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

2. AUTH PROTECTION:
Wrap all /admin routes with NextAuth middleware:
- Check session exists
- Check session.user.role === 'admin'
- Redirect to /login if not authenticated

3. API ROUTES needed:
- GET/POST /api/admin/products
- PUT/DELETE /api/admin/products/[id]
- GET/PUT /api/admin/orders
- PUT /api/admin/orders/[id]/status
- GET/PUT /api/admin/inventory
- GET /api/admin/customers
- GET/POST/PUT/DELETE /api/admin/coupons
- GET/POST/PUT/DELETE /api/admin/banners
- GET /api/admin/overview (KPIs)
- POST /api/upload (R2 presigned URL)

4. CHARTS: Use recharts for all charts. Import: import { LineChart, BarChart, PieChart, ... } from 'recharts'

5. FORMS: Use React Hook Form + Zod for all forms.
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

6. TABLES: Use TanStack Table (React Table v8) for all data tables.

7. IMAGE UPLOAD TO R2:
Step 1: POST to /api/upload with { fileName, fileType } → get { signedUrl, publicUrl }
Step 2: PUT directly to signedUrl with file
Step 3: Save publicUrl to database

8. TOAST NOTIFICATIONS: Use shadcn/ui toast for all success/error feedback.

9. LOADING STATES: Every table and chart must show a skeleton loader while data loads.

10. RESPONSIVE: Admin dashboard must work on tablet (768px+). On mobile, sidebar collapses to a hamburger menu.

---

## SAMPLE DATA TO USE

Products:
1. Multigrain Sourdough Loaf — Breads — ₹85/₹150 — Stock: 48
2. Olive & Rosemary Sourdough — Breads — ₹128/₹240 — Stock: 8 (LOW)
3. Butter Chocolate Brownie — Cakes — ₹180/₹320 — Stock: 24
4. Cold Pressed Coconut Oil — FMCG — ₹299/₹550 — Stock: 3 (CRITICAL)
5. Oat & Honey Cookies — Snacks — ₹120/₹220 — Stock: 67
6. Whole Wheat Croissant — Breads — ₹95/₹180 — Stock: 5 (LOW)
7. Protein Granola Mix — FMCG — ₹249/₹450 — Stock: 31
8. Mango Chiffon Cake — Cakes — ₹380/₹680 — Stock: 0 (OUT)

Orders (recent):
#ORD-1247 — Priya Sharma — ₹485 — Multigrain Bread x2, Cookies x1 — UPI — Delivered
#ORD-1246 — Rahul Mehta — ₹299 — Coconut Oil x1 — Card — Shipped
#ORD-1245 — Sneha Patel — ₹560 — Brownie x1, Croissant x2 — COD — Confirmed
#ORD-1244 — Arjun Singh — ₹850 — Mango Cake x1, Granola x1 — UPI — Pending
#ORD-1243 — Kavya Nair — ₹240 — Sourdough x2 — Card — Delivered

Coupons:
FRESHBAKE — 10% off — Min ₹299 — 124/500 uses — Active
WELCOME50 — ₹50 off — Min ₹499 — 89/200 uses — Active
HEALTH20 — 20% off — Min ₹699 — 312/∞ uses — Expired

---

## IMPORTANT INSTRUCTIONS FOR ANTIGRAVITY

- Build all 10 steps as separate tasks dispatched in parallel where possible
- Use the exact color values provided — do not substitute with Tailwind defaults
- Every page must import and use the shared AdminSidebar and AdminTopBar components
- All data must come from API routes (not hardcoded in page components)
- Use 'use client' only where needed (forms, charts, interactive components)
- Server components for data fetching by default (Next.js 14 App Router pattern)
- TypeScript strict mode — define interfaces for all data shapes
- Do NOT use any Supabase or Firebase — use Prisma + PostgreSQL only
- Follow the exact folder structure defined above
- After building, run: npx prisma generate && npx prisma migrate dev --name admin-dashboard
```

---

## HOW TO USE THIS IN ANTIGRAVITY

1. Open Antigravity IDE
2. Open your Next.js project (or create new with: `npx create-next-app@latest dailybake --typescript --tailwind --app`)
3. Install dependencies first — paste this into Antigravity chat:

```
Install these packages:
npm install prisma @prisma/client next-auth @auth/prisma-adapter
npm install recharts react-hook-form @hookform/resolvers zod
npm install @tanstack/react-table lucide-react
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install sonner date-fns
npx shadcn@latest init
npx shadcn@latest add button input label select textarea table badge card dialog sheet tabs toast
```

4. Set your `.env` variables:
```
DATABASE_URL="postgresql://bakeryuser:password@your-vps-ip:5432/bakerystore"
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-key"
CLOUDFLARE_R2_BUCKET_NAME="dailybake-images"
CLOUDFLARE_R2_PUBLIC_URL="https://your-r2-domain.com"
```

5. Then paste the MASTER PROMPT above into Antigravity

6. Let Antigravity dispatch agents for each step in parallel

---

## QUICK SINGLE-SECTION PROMPTS

Use these to build or fix individual sections separately:

**Sidebar only:**
```
Build the AdminSidebar component for The Daily Bake admin dashboard. 
Dark green background (#1a2c1a), logo in white Playfair Display font, 
nav links with lucide-react icons, active state amber (#c8872a) left border, 
hover state rgba(255,255,255,0.05). Routes: /admin, /admin/products, 
/admin/orders, /admin/inventory, /admin/customers, /admin/coupons, /admin/banners.
```

**Overview dashboard only:**
```
Build the admin overview page for The Daily Bake bakery store.
4 KPI stat cards (Revenue ₹1,24,580 / Orders 1,247 / Customers 843 / Avg ₹485),
recharts LineChart for 30-day revenue, recent orders table with status badges,
low stock alerts panel. Colors: primary green #3d5a2e, amber #c8872a, bg #f0f2e8.
```

**Product form only:**
```
Build the add/edit product form for The Daily Bake admin. 
Two-column layout: left has product name, slug, description, category dropdown, 
variant table (label/price/stock/SKU with add/remove rows), dietary checkboxes.
Right has R2 image upload dropzone, SEO fields, pricing summary card.
Use React Hook Form + Zod validation. On save, POST to /api/admin/products.
```

**Orders page only:**
```
Build the order management page for The Daily Bake admin.
Stats strip (today/pending/shipped/delivered), filter bar with status tabs,
orders table (ID/customer/items/total/payment/status/actions),
status badges: pending=amber, confirmed=blue, shipped=purple, delivered=green, cancelled=red.
Row click opens order detail page at /admin/orders/[id].
```

---

*Generated by Claude for The Daily Bake — Eleveto AI — May 2026*
