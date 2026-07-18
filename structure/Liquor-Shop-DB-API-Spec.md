# Database Schema & API Specification
## [Shop Name] — Online Liquor Ordering Website & Admin Panel

**Version:** 1.0
**Based on:** SRS v1.0

---

## 1. Database Schema

### 1.1 `products`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| name | VARCHAR(150) | |
| category | VARCHAR(50) | e.g., Whiskey, Beer, Wine, Vodka, Rum |
| brand | VARCHAR(100) | |
| volume_ml | INTEGER | e.g., 750, 375, 180 |
| price | DECIMAL(10,2) | |
| stock_qty | INTEGER | |
| image_url | TEXT | |
| description | TEXT | |
| is_active | BOOLEAN | default true; used for soft-delete |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 1.2 `customers`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| phone | VARCHAR(15) | unique, used for OTP login |
| name | VARCHAR(100) | |
| created_at | TIMESTAMP | |

### 1.3 `customer_addresses`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| customer_id | FK → customers.id | |
| address_line | TEXT | |
| pincode | VARCHAR(10) | |
| is_default | BOOLEAN | |

### 1.4 `orders`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| customer_id | FK → customers.id | |
| status | ENUM | Placed, Confirmed, Out for Delivery, Delivered, Cancelled |
| payment_mode | ENUM | COD (v1 only) |
| delivery_address | TEXT | snapshot at order time |
| pincode | VARCHAR(10) | snapshot at order time |
| subtotal | DECIMAL(10,2) | |
| delivery_charge | DECIMAL(10,2) | default 0 |
| total_amount | DECIMAL(10,2) | |
| age_confirmed | BOOLEAN | audit trail for compliance |
| tnc_accepted | BOOLEAN | audit trail for compliance |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 1.5 `order_items`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| order_id | FK → orders.id | |
| product_id | FK → products.id | |
| quantity | INTEGER | |
| price_at_order | DECIMAL(10,2) | snapshot — protects against future price changes |

### 1.6 `admins`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| username | VARCHAR(50) | unique |
| password_hash | TEXT | bcrypt hashed |
| created_at | TIMESTAMP | |

### 1.7 `serviceable_zones`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| pincode | VARCHAR(10) | unique |
| delivery_start_time | TIME | e.g., 10:00 |
| delivery_end_time | TIME | e.g., 21:00 |
| is_active | BOOLEAN | |

### 1.8 Relationships
```
customers 1---N customer_addresses
customers 1---N orders
orders    1---N order_items
products  1---N order_items
```

---

## 2. API Endpoints

Base URL: `/api/v1`

### 2.1 Auth
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/customer/otp/send` | Send OTP to phone | Public |
| POST | `/auth/customer/otp/verify` | Verify OTP, return session token | Public |
| POST | `/auth/admin/login` | Admin login (username/password) | Public |

### 2.2 Products (Customer-facing, read-only)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/products` | List products (supports `?category=`, `?search=`, `?minPrice=`, `?maxPrice=`) | Public |
| GET | `/products/:id` | Get single product detail | Public |

### 2.3 Products (Admin — write access)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/admin/products` | Create product | Admin |
| PUT | `/admin/products/:id` | Edit product | Admin |
| PATCH | `/admin/products/:id/stock` | Update stock qty / in-stock flag | Admin |
| DELETE | `/admin/products/:id` | Deactivate product (soft delete) | Admin |

### 2.4 Cart & Checkout
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/cart/validate-pincode` | Check if pincode is serviceable | Public |
| POST | `/orders` | Place a new order | Customer (authenticated) |
| GET | `/orders/:id` | Get order detail | Customer (own order only) |
| GET | `/orders/my` | List logged-in customer's order history | Customer (authenticated) |

**`POST /orders` request body (example):**
```json
{
  "items": [
    { "product_id": "uuid", "quantity": 2 }
  ],
  "delivery_address": "123 MG Road, ...",
  "pincode": "560001",
  "age_confirmed": true,
  "tnc_accepted": true,
  "payment_mode": "COD"
}
```
Server must re-validate: pincode is serviceable, delivery hour is within allowed window, stock is sufficient — do not trust client-side checks.

### 2.5 Orders (Admin)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/admin/orders` | List all orders (supports `?status=`, `?date=`, `?search=`) | Admin |
| GET | `/admin/orders/:id` | Get full order detail | Admin |
| PATCH | `/admin/orders/:id/status` | Update order status | Admin |

### 2.6 Serviceable Zones (Admin)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/admin/zones` | List all zones | Admin |
| POST | `/admin/zones` | Add new pincode + hours | Admin |
| PUT | `/admin/zones/:id` | Edit pincode/hours | Admin |
| DELETE | `/admin/zones/:id` | Remove pincode | Admin |

### 2.7 Dashboard (Admin)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/admin/dashboard/summary` | Today's orders, pending count, revenue snapshot | Admin |

---

## 3. Key Backend Validation Rules (Enforce Server-Side)

- Reject order if `pincode` not found in active `serviceable_zones`
- Reject order if current time is outside the zone's `delivery_start_time`–`delivery_end_time`
- Reject order if `age_confirmed` or `tnc_accepted` is false
- Reject order if any item's `quantity` exceeds available `stock_qty`
- On successful order creation: decrement `stock_qty` for each ordered product within the same transaction (avoid overselling)

---

## 4. Suggested Build Order for This Layer

1. `products` + `admins` tables → Product CRUD APIs → test via Postman
2. `customers` + `customer_addresses` + OTP auth → test login flow
3. `serviceable_zones` table + APIs → needed before orders can validate correctly
4. `orders` + `order_items` tables → Order placement API with full validation
5. Admin order APIs (list, detail, status update)
6. Dashboard summary API (can be a simple aggregate query once orders exist)
