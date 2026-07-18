# Software Requirements Specification (SRS)
## [Shop Name] — Online Liquor Ordering Website & Admin Panel

**Version:** 1.0
**Date:** July 2026
**Based on:** Simplified PRD v2.0

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for a two-part system: a customer-facing e-commerce website for ordering liquor, and an admin panel for the shop owner to manage products and orders.

### 1.2 Scope
The system will allow:
- Customers to browse products, add to cart, and place orders with Cash on Delivery
- The shop owner to manage inventory and process incoming orders

The system will enforce age verification and delivery-zone restrictions per the shop's excise license.

### 1.3 Intended Audience
Developer(s) building the system, and the shop owner as product owner.

### 1.4 Definitions
| Term | Meaning |
|---|---|
| SKU | Stock Keeping Unit (a unique product+variant) |
| COD | Cash on Delivery |
| Admin | Shop owner/staff managing the backend |
| Serviceable pincode | A delivery area covered under the shop's license |

---

## 2. Overall Description

### 2.1 Product Perspective
Standalone web application, not integrated with any external POS system in v1. Two front-ends (customer site, admin panel) sharing one backend and database.

### 2.2 User Classes
| User Class | Description | Technical Expertise |
|---|---|---|
| Customer | Places orders | Low — general public |
| Admin | Manages products/orders | Low-Medium — shop owner/staff |

### 2.3 Operating Environment
- Web-based, accessed via desktop or mobile browser (Chrome, Safari, Edge — latest 2 versions)
- Backend hosted on cloud infrastructure (e.g., Render/Railway)
- Database: PostgreSQL/MySQL

### 2.4 Assumptions & Dependencies
- Shop owner has valid excise license and knows exact permitted pincodes/hours
- SMS/OTP provider account will be set up for phone verification (e.g., MSG91, Twilio)
- Payment is COD only for v1 — no gateway dependency

---

## 3. Functional Requirements

### FR-1: Age Verification
- **FR-1.1**: System shall display an age-confirmation gate before any product content is shown.
- **FR-1.2**: System shall block access and redirect away if the user indicates they are underage.
- **FR-1.3**: System shall remember the confirmation for the session (cookie/localStorage) to avoid repeat prompts.

### FR-2: Product Catalog
- **FR-2.1**: System shall display products grouped by category (Whiskey, Beer, Wine, Vodka, Rum, etc.).
- **FR-2.2**: System shall allow filtering by category, brand, and price range.
- **FR-2.3**: System shall show stock status (In Stock / Out of Stock) per product.
- **FR-2.4**: System shall provide a search function across product name/brand.
- **FR-2.5**: System shall display a product detail page with image, price, volume, brand, description.

### FR-3: Cart
- **FR-3.1**: System shall allow adding a product (with quantity) to cart.
- **FR-3.2**: System shall allow editing quantity or removing items from cart.
- **FR-3.3**: System shall calculate subtotal, delivery charge (if applicable), and total in real time.
- **FR-3.4**: System shall validate the entered delivery pincode against the serviceable-pincode list before allowing checkout to proceed.

### FR-4: Checkout & Order Placement
- **FR-4.1**: System shall collect delivery address (name, phone, address line, pincode).
- **FR-4.2**: System shall restrict order placement to configured delivery hours.
- **FR-4.3**: System shall require acceptance of Terms & Conditions and a responsible-drinking disclaimer before order submission.
- **FR-4.4**: System shall support Cash on Delivery as the payment method in v1.
- **FR-4.5**: System shall generate a unique order ID upon successful order placement.
- **FR-4.6**: System shall reduce stock quantity for ordered SKUs upon order confirmation.

### FR-5: Customer Account & Order History
- **FR-5.1**: System shall support customer login via phone number + OTP.
- **FR-5.2**: System shall allow a logged-in customer to view their past orders and current order status.
- **FR-5.3**: System shall display order status as one of: Placed, Confirmed, Out for Delivery, Delivered, Cancelled.

### FR-6: Admin Authentication
- **FR-6.1**: System shall provide a single admin login (username/password).
- **FR-6.2**: System shall restrict admin panel access to authenticated admin sessions only.

### FR-7: Admin — Product Management
- **FR-7.1**: Admin shall be able to add a new product (name, category, brand, price, volume, stock quantity, image).
- **FR-7.2**: Admin shall be able to edit existing product details.
- **FR-7.3**: Admin shall be able to mark a product In Stock / Out of Stock.
- **FR-7.4**: Admin shall be able to deactivate/delete a product.

### FR-8: Admin — Order Management
- **FR-8.1**: Admin shall see a list of incoming orders, newest first.
- **FR-8.2**: Admin shall be able to view full order details (items, customer info, address, payment mode).
- **FR-8.3**: Admin shall be able to update order status (Confirm → Out for Delivery → Delivered / Cancelled).
- **FR-8.4**: Admin shall be able to filter/search orders by date, status, or customer.

### FR-9: Admin — Delivery Zone & Hours Configuration
- **FR-9.1**: Admin shall be able to add/remove serviceable pincodes.
- **FR-9.2**: Admin shall be able to set permitted delivery hours.
- **FR-9.3**: Changes to zones/hours shall immediately apply to new orders on the customer site.

### FR-10: Notifications (Basic)
- **FR-10.1**: System shall send an order confirmation via SMS or email upon order placement.
- **FR-10.2**: System shall notify the customer when order status changes to "Out for Delivery" and "Delivered" (optional for v1, recommended for v1.1).

---

## 4. Non-Functional Requirements

### NFR-1: Performance
- Pages shall load within 3 seconds on a standard 4G connection.
- Admin panel shall handle at least 100 concurrent orders without degradation.

### NFR-2: Security
- All traffic shall be served over HTTPS.
- Admin panel shall not be accessible without authentication.
- No raw payment data is stored (not applicable in COD-only v1, but design should anticipate future gateway integration).
- Customer phone numbers/addresses shall be stored securely and not exposed via public APIs.

### NFR-3: Usability
- Customer site shall be mobile-responsive (primary usage expected on phones).
- Admin panel shall be usable on both desktop and tablet.

### NFR-4: Reliability
- System uptime target: 99% (basic hosting-tier expectation, no need for enterprise SLAs at this stage).

### NFR-5: Maintainability
- Codebase shall be structured to allow adding an online payment gateway and delivery-staff app in future phases without a full rebuild.

### NFR-6: Compliance
- System shall enforce age gating, pincode restriction, and delivery-hour restriction as hard blocks (not just UI warnings) — order submission must be rejected server-side if these conditions aren't met.
- Excise license number shall be displayed on every page footer.

---

## 5. Data Requirements (High-Level Entities)

| Entity | Key Fields |
|---|---|
| **Product** | id, name, category, brand, price, volume, stock_qty, image_url, is_active |
| **Customer** | id, phone, name, addresses[] |
| **Order** | id, customer_id, items[], total_amount, status, payment_mode, delivery_address, pincode, created_at |
| **OrderItem** | order_id, product_id, quantity, price_at_order |
| **Admin** | id, username, password_hash |
| **ServiceableZone** | pincode, delivery_hours_start, delivery_hours_end |

---

## 6. External Interface Requirements

### 6.1 User Interfaces
- Customer website: homepage, category/listing page, product detail, cart, checkout, order history
- Admin panel: login, dashboard, product management, order management, zone settings

### 6.2 Communication Interfaces
- SMS/OTP provider API (for login and order notifications)
- No payment gateway integration in v1 (COD only)

---

## 7. Constraints

- Payment limited to COD in v1 due to alcohol-related restrictions on mainstream Indian payment gateways.
- Delivery execution (rider assignment) is manual/off-system in v1 — no delivery-staff app.
- Single admin login only — no multi-user roles in v1.

---

## 8. Future Enhancements (Out of Scope for v1)

- Online payment gateway integration (pending compliant provider)
- Delivery staff mobile view/app
- Customer reviews and ratings
- Promotions/discount codes
- Multi-branch/multi-admin support
