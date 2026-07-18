# Product Requirements Document
## [Shop Name] — Simple Online Liquor Ordering Website + Admin Panel

**Version:** 2.0 (Simplified Scope)
**Date:** July 2026

---

## 1. Overview

A simple e-commerce style website (like Flipkart/Amazon, but scoped down) where customers browse products and place orders, and a single admin panel where the shop owner manages products and processes those orders. No delivery staff app, no loyalty features, no multi-branch — just two things: **customer ordering site** and **admin order/inventory panel**.

---

## 2. Two Parts of the System

### Part A: Customer Website
### Part B: Admin Panel (shop owner only)

---

## 3. Part A — Customer Website

### 3.1 Age Verification Gate
- First-visit popup: "Are you 21+?" confirmation before browsing anything
- Blocks access if user selects "No" / underage

### 3.2 Homepage
- Banner/featured products
- Category list: Whiskey, Beer, Wine, Vodka, Rum, etc.
- Search bar

### 3.3 Product Listing Page
- Grid of products with image, name, price, volume
- Filter by category, price range, brand
- "In stock" / "Out of stock" label

### 3.4 Product Detail Page
- Image, name, brand, volume, price, description
- Quantity selector
- Add to Cart button

### 3.5 Cart Page
- List of items with quantity edit/remove
- Subtotal, delivery charge (if any), total
- Delivery pincode check (only proceed if serviceable)
- "Proceed to Checkout" button

### 3.6 Checkout
- Delivery address form (name, phone, address, pincode)
- Payment method: **Cash on Delivery** (simplest to start; add online payment later once a compliant gateway is confirmed)
- Order summary + T&C / responsible drinking disclaimer checkbox
- "Place Order" button

### 3.7 Order Confirmation
- Order ID, summary, estimated delivery
- (Optional) SMS/email confirmation

### 3.8 My Orders (simple account)
- Phone number/OTP login
- List of past orders with status: Placed → Confirmed → Out for Delivery → Delivered

---

## 4. Part B — Admin Panel

### 4.1 Login
- Single admin login (username/password) — no need for multiple roles at this scope

### 4.2 Dashboard
- Today's orders count, pending orders, revenue snapshot

### 4.3 Product Management
- Add new product (name, category, brand, price, volume, stock qty, image)
- Edit product (price, stock, availability)
- Delete/deactivate product
- Mark in-stock / out-of-stock

### 4.4 Order Management
- List of all incoming orders (newest first)
- View order detail: items, customer info, delivery address, payment mode
- Update order status: Confirm → Out for Delivery → Delivered → (Cancelled if needed)
- Simple search/filter by date, status, customer

### 4.5 Delivery Zone Settings
- Add/remove serviceable pincodes (orders outside these are auto-blocked at checkout)
- Set delivery hours (per your license restrictions)

---

## 5. What's Deliberately Left Out (Keep It Simple)

- No delivery staff app — owner manages delivery manually via phone/local rider once order is confirmed
- No online payment gateway in v1 — COD only, to avoid alcohol payment compliance issues at launch
- No loyalty points, coupons, or promotions
- No multi-store/branch support
- No customer reviews/ratings

These can all be added later once the core flow is working.

---

## 6. Suggested Tech Stack (Simple & Fast to Build)

- **Frontend**: React (or Next.js)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL or MySQL
- **Hosting**: Vercel (frontend) + Railway/Render (backend + DB)
- **Auth**: Phone OTP for customers (e.g., MSG91/Twilio), simple username/password for admin
- **Image storage**: Cloudinary or S3 for product images

Alternative faster route: **Shopify or WooCommerce**, customized with age-gate and pincode-restriction plugins — worth considering if you want to launch in days instead of weeks, though alcohol listings may need manual approval or workarounds on some platforms.

---

## 7. Core User Flow (End to End)

1. Customer visits site → confirms age → browses products
2. Adds items to cart → enters pincode → checks serviceability
3. Checks out with COD → places order
4. Admin sees new order in panel → confirms it (checks stock)
5. Admin arranges delivery (own staff/local rider)
6. Admin marks order "Delivered" once complete
7. Customer can view order status/history anytime

---

## 8. Compliance Checklist (Keep Enforced Even in Simple Version)

- [ ] Age gate on entry
- [ ] License number shown in footer
- [ ] Delivery restricted to licensed pincodes
- [ ] Delivery restricted to permitted hours
- [ ] Responsible drinking disclaimer at checkout

---

## 9. MVP Build Order (Suggested)

1. Admin panel: product add/edit + view orders (so you can start managing inventory digitally even before the customer site is live)
2. Customer site: browsing + cart + checkout (COD)
3. Connect order flow: customer order → appears in admin panel
4. Age gate + pincode restriction
5. Order status updates + basic order history for customers
