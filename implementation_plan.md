# Goal Description

The objective is to build the complete customer-facing e-commerce storefront for **"The Daily Bake"**. 
The project already has a well-structured database schema (Products, Categories, Orders, Customers, Coupons, Banners) and an admin dashboard. We will leverage this existing architecture to build a fully functional, beautifully designed B2C shopping experience using Next.js 14 App Router, Tailwind CSS, and shadcn/ui.

## User Review Required

> [!IMPORTANT]
> This is a large-scale feature that will touch many parts of the application. Please review the proposed architecture and design approach.
> If you have specific references or wireframes for the storefront design, please share them!

## Open Questions

> [!WARNING]
> 1. **Cart State Management:** Should we use a global React Context for the shopping cart, or install a lightweight library like `zustand`? (I recommend React Context to minimize dependencies, but Zustand is cleaner for Next.js).
> 2. **Authentication:** Do you want customers to be able to check out as "Guests", or force them to log in / create an account before checkout?
> 3. **Payment Integration:** Currently, the database schema supports "UPI", "Card", and "COD". Should we build a mock checkout flow for now, or do you have a specific payment gateway (like Razorpay/Stripe) you want integrated?

## Proposed Changes

---

### Layout & Global UI
Creating the shell of the storefront that persists across pages.

#### [NEW] `app/(store)/layout.tsx`
- **Header:** Logo ("The Daily Bake" in Playfair Display), Category Navigation (Breads, Cakes, FMCG), Search Bar, and Cart Icon with badge.
- **Announcement Bar:** Fetched dynamically from the `Banner` model (Position: ANNOUNCEMENT).
- **Footer:** Links, social icons, newsletter signup.
- **Cart Drawer:** A slide-out sidebar (shadcn Sheet) showing current cart items and subtotal.

#### [NEW] `components/store/StoreHeader.tsx`
#### [NEW] `components/store/StoreFooter.tsx`
#### [NEW] `components/store/CartDrawer.tsx`

---

### Home Page
The landing page to welcome customers and showcase products.

#### [MODIFY] `app/page.tsx`
- **Hero Section:** Large banner carousel (fetched from `Banner` model, Position: HERO).
- **Categories Grid:** Visual cards linking to different product categories.
- **Bestsellers Section:** A grid of top-rated or featured products.

---

### Product Discovery (Browsing & Searching)

#### [NEW] `app/products/page.tsx`
- Main shopping page listing all active products.
- **Sidebar Filters:** Filter by Category, Nutrition Tags (Vegan, Gluten-Free, etc.).
- **Sorting:** Price Low-High, Newest, etc.

#### [NEW] `app/category/[slug]/page.tsx`
- Dynamic route to show products for a specific category (e.g., `/category/breads-loaves`).

---

### Product Detail Page (PDP)

#### [NEW] `app/product/[slug]/page.tsx`
- **Left Side:** Image gallery.
- **Right Side:** Product name, price (dynamic based on variant), description.
- **Variant Selector:** Buttons to choose weight/size (e.g., 400g, 800g).
- **Add to Cart:** Quantity selector and Add to Cart button.
- **Badges:** Visual indicators for Nutritional Tags (Zero Maida, High Protein).

---

### Checkout Flow

#### [NEW] `app/checkout/page.tsx`
- **Step 1:** Customer Details (Email, Phone).
- **Step 2:** Shipping Address (form to create an `Address` record).
- **Step 3:** Payment Method selection (UPI, Card, COD).
- **Order Summary:** Display items, apply Coupon Codes, calculate total with delivery charges.
- **Action:** "Place Order" button which creates an `Order` and `OrderItem` records in the database.

#### [NEW] `app/checkout/success/[orderId]/page.tsx`
- Order confirmation page showing the generated `#ORD-XXXX` tracking number and summary.

---

### State Management & Context

#### [NEW] `lib/store/CartContext.tsx`
- React Context provider to manage cart state (`items`, `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`).
- Persist cart data in `localStorage` so items remain upon page refresh.

## Verification Plan

### Manual Verification
1. **Browsing:** Navigate through the Home page, Category pages, and Product Detail pages to ensure products load correctly from the database.
2. **Cart Flow:** Add various variants to the cart, verify prices update correctly, and ensure the slide-out cart works smoothly.
3. **Checkout:** Complete a test checkout flow using "Cash on Delivery" to verify that an `Order` is successfully written to the database and appears in the Admin Dashboard.
4. **Design Quality:** Ensure the storefront strictly adheres to the "Daily Bake" brand guidelines (Green `#3d5a2e`, Amber `#c8872a`, Playfair Display / DM Sans typography).
