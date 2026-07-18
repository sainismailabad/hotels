# 🏨 Beto Hotel Booking Platform — Complete PRD & System Architecture

> **Version:** 1.0.0  
> **Status:** Production-Ready Specification  
> **Author:** Senior Full-Stack Software Architect  
> **Last Updated:** July 13, 2026

---

## TABLE OF CONTENTS

1. [Project Overview & Scope](#1-project-overview--scope)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [API Endpoints Architecture](#5-api-endpoints-architecture)
6. [Frontend Route Structure](#6-frontend-route-structure)
7. [Authentication & Role Management](#7-authentication--role-management)
8. [Super Admin Panel](#8-super-admin-panel)
9. [Hotel Owner Panel](#9-hotel-owner-panel)
10. [Customer Frontend & Booking Flow](#10-customer-frontend--booking-flow)
11. [WhatsApp Notification System](#11-whatsapp-notification-system)
12. [Database Relationships Diagram](#12-database-relationships-diagram)
13. [File/Folder Structure](#13-filefolder-structure)
14. [Deployment Checklist](#14-deployment-checklist)

---

## 1. PROJECT OVERVIEW & SCOPE

### 1.1 Vision
A **multi-vendor hotel booking platform** where customers can discover and book hotels across India, hotel owners can manage their properties and front-desk operations, and super admins govern the entire ecosystem — all with **real-time WhatsApp notifications** woven into every transaction.

### 1.2 User Roles

| Role | Description | Access Level |
|------|-------------|-------------|
| **Super Admin** | Platform owner. Manages users, hotels, approvals, all bookings. | Full System Access |
| **Hotel Owner (Vendor)** | Owns/manages one or more hotels. Handles inventory, pricing, front-desk. | Own Hotels Only |
| **Customer** | Browses hotels, makes bookings, views history. | Public + Own Bookings |

### 1.3 Core Features Summary

| Module | Features |
|--------|----------|
| **Authentication** | Unified email/password login, role-based JWT, auto-redirect |
| **Super Admin** | User management, hotel CRUD, global booking monitoring, WhatsApp credentials management |
| **Hotel Owner** | Dashboard (stats), booking management, check-in/check-out, room inventory, date blocking |
| **Customer** | Search hotels, hotel detail, booking with "Pay at Hotel", booking history, WhatsApp confirmation |
| **WhatsApp** | Instant notifications on booking confirm, check-in, check-out, cancellation, admin alerts |

### 1.4 Scope Boundaries

| In Scope | Out of Scope |
|----------|-------------|
| Multi-role authentication & authorization | Online payment gateway integration |
| Hotel owner credential management by admin | User reviews & ratings |
| WhatsApp notifications via Twilio/WATI | Multi-language support |
| Front-desk check-in/check-out system | Mobile apps (native) |
| Dynamic pricing & inventory | Loyalty/rewards program |
| Basic search & filtering | Advanced analytics & ML |

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Frontend)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Customer │  │  Hotel   │  │  Super   │  │  Public  │   │
│  │  UI      │  │  Owner   │  │  Admin   │  │  API     │   │
│  │          │  │  UI      │  │  UI      │  │  Docs    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼──────────────┼──────────────┼──────────────┼────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│              API GATEWAY / LOAD BALANCER                      │
│         (Next.js API Routes / Express Routes)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER (Backend)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Auth     │  │ Booking  │  │ Hotel    │  │WhatsApp  │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │        │
│  ┌────▼──────────────▼──────────────▼──────────────▼─────┐  │
│  │              MIDDLEWARE (Auth, Validation, Logging)    │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │    MongoDB /          │  │  Redis Cache                 │ │
│  │    PostgreSQL         │  │  (Sessions, Rate Limiting)   │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                EXTERNAL SERVICES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Twilio /     │  │   SMTP       │  │   Cloudinary │      │
│  │ WATI API     │  │   Email      │  │   (Images)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow for Booking

```
Customer → Search Hotels → View Detail → Select Dates/Room
    → Fill Details → Click "Book Now (Pay at Hotel)"
    → API Creates Booking (status: "pending")
    → WhatsApp: Confirmation to Customer
    → WhatsApp: Notification to Hotel Owner
    → Hotel Owner sees booking in dashboard
    → Customer arrives → Owner marks "Checked-In"
    → WhatsApp: Check-in notification to Customer
    → Customer checks out → Owner marks "Checked-Out"
    → WhatsApp: Check-out + thank you to Customer
```

---

## 3. TECH STACK

### 3.1 Recommended Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | 14.x |
| **UI Framework** | Tailwind CSS + shadcn/ui | Latest |
| **State Management** | React Query (TanStack Query) + Zustand | Latest |
| **Backend** | Next.js Server Actions + API Routes | 14.x |
| **Database** | MongoDB (via Mongoose) OR PostgreSQL (via Prisma) | Latest |
| **Authentication** | NextAuth.js v5 (Auth.js) | v5 |
| **Caching** | Redis (Upstash) | Latest |
| **WhatsApp** | WATI.io API (preferred) or Twilio WhatsApp API | REST |
| **File Storage** | Cloudinary / AWS S3 | Latest |
| **Deployment** | Vercel (frontend) + Railway/Render (DB) | - |

### 3.2 Alternative Stack (Current Firebase-based)

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML/CSS/JS (current) → Migrate to Next.js |
| **Database** | Firebase Realtime DB |
| **Auth** | Firebase Auth |
| **Deployment** | Firebase Hosting / Vercel |

---

## 4. DATABASE SCHEMA

### 4.1 User Collection (`users`)

```javascript
// MONGODB SCHEMA
const userSchema = {
  _id: ObjectId,
  uid: String,                    // Firebase UID or custom ID
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },  // hashed
  role: { 
    type: String, 
    enum: ['customer', 'hotel_owner', 'super_admin'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending_verification'],
    default: 'active'
  },
  
  // Hotel Owner Specific Fields
  hotelOwnerId: { type: ObjectId, ref: 'HotelOwner' },  // link to owner profile
  
  // Metadata
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  lastLoginAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// INDEXES
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
```

### 4.2 Hotel Owner Collection (`hotel_owners`)

```javascript
const hotelOwnerSchema = {
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true, unique: true },
  
  // Business Details
  companyName: { type: String, required: true },
  gstNumber: String,
  ownerName: { type: String, required: true },
  ownerPhone: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  
  // Platform Credentials (Generated by Admin)
  loginId: { type: String, unique: true, sparse: true },  // e.g., "HTL_MUM_001"
  loginPassword: { type: String },  // auto-generated, hashed
  
  // Commission & Financials
  commissionRate: { type: Number, default: 15 },  // percentage
  totalRevenue: { type: Number, default: 0 },
  pendingPayout: { type: Number, default: 0 },
  
  // WhatsApp Notification Preferences
  whatsappEnabled: { type: Boolean, default: true },
  whatsappPhone: String,
  
  // Approval Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: 'pending'
  },
  approvedBy: { type: ObjectId, ref: 'User' },
  approvedAt: Date,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// INDEXES
hotelOwnerSchema.index({ userId: 1 });
hotelOwnerSchema.index({ loginId: 1 }, { unique: true, sparse: true });
hotelOwnerSchema.index({ status: 1 });
```

### 4.3 Hotel Collection (`hotels`)

```javascript
const hotelSchema = {
  _id: ObjectId,
  hotelOwnerId: { type: ObjectId, ref: 'HotelOwner', required: true },
  
  // Basic Info
  name: { type: String, required: true },
  slug: { type: String, unique: true },  // URL-friendly name
  description: { type: String, required: true },
  
  // Location
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: String,
  country: { type: String, default: 'India' },
  coordinates: {
    lat: Number,
    lng: Number
  },
  
  // Media
  images: [{ type: String }],  // Array of URLs
  thumbnail: String,
  
  // Ratings & Reviews (basic)
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  
  // Features
  amenities: [{ type: String }],  // ["Free WiFi", "Pool", "Gym", ...]
  policies: {
    checkIn: { type: String, default: '14:00' },
    checkOut: { type: String, default: '11:00' },
    cancellationPolicy: { type: String, default: 'Free cancellation 24h before' },
    refundPolicy: { type: String, default: 'Full refund if cancelled 24h before' }
  },
  
  // Pricing (Base)
  basePrice: { type: Number, required: true },  // per night for standard room
  
  // Inventory (Aggregated)
  totalRooms: { type: Number, required: true },
  availableRooms: { type: Number, default: 0 },
  
  // Status
  featured: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// INDEXES
hotelSchema.index({ city: 1, state: 1 });
hotelSchema.index({ hotelOwnerId: 1 });
hotelSchema.index({ status: 1, featured: 1 });
hotelSchema.index({ slug: 1 }, { unique: true });
hotelSchema.index({ 'coordinates': '2dsphere' });  // for geo queries
```

### 4.4 Room Type Collection (`room_types`)

```javascript
const roomTypeSchema = {
  _id: ObjectId,
  hotelId: { type: ObjectId, ref: 'Hotel', required: true },
  
  // Room Details
  name: { type: String, required: true },  // Standard, Deluxe, Suite, Penthouse
  description: String,
  capacity: { type: Number, default: 2 },  // max guests
  size: String,  // e.g., "350 sq ft"
  
  // Pricing
  priceMultiplier: { type: Number, default: 1.0 },  // basePrice * multiplier
  basePrice: { type: Number, required: true },  // explicit price per night
  dynamicPricing: {
    enabled: { type: Boolean, default: false },
    weekendMultiplier: { type: Number, default: 1.2 },
    seasonalMultipliers: [{ season: String, multiplier: Number, startDate: Date, endDate: Date }]
  },
  
  // Inventory per room type
  totalRooms: { type: Number, required: true },
  availableRooms: { type: Number, default: 0 },
  
  // Amenities specific to room
  amenities: [{ type: String }],
  
  // Images
  images: [{ type: String }],
  
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// INDEXES
roomTypeSchema.index({ hotelId: 1, name: 1 });
roomTypeSchema.index({ status: 1 });
```

### 4.5 Booking Collection (`bookings`)

```javascript
const bookingSchema = {
  _id: ObjectId,
  bookingId: { type: String, unique: true },  // e.g., "BETO-20260713-A3F2K"
  
  // Customer Details
  customerId: { type: ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  
  // Hotel Details
  hotelId: { type: ObjectId, ref: 'Hotel', required: true },
  hotelOwnerId: { type: ObjectId, ref: 'HotelOwner', required: true },
  hotelName: String,
  roomTypeId: { type: ObjectId, ref: 'RoomType' },
  roomTypeName: String,
  
  // Booking Details
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true, min: 1 },
  rooms: { type: Number, default: 1 },
  nights: { type: Number, required: true },
  
  // Pricing Breakdown
  basePricePerNight: { type: Number, required: true },
  roomTypeMultiplier: { type: Number, default: 1 },
  effectivePricePerNight: { type: Number, required: true },
  subtotal: { type: Number, required: true },  // effectivePrice * nights
  taxRate: { type: Number, default: 12 },  // percentage
  taxAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  
  // Payment
  paymentMethod: { 
    type: String, 
    enum: ['pay_at_hotel', 'online'],
    default: 'pay_at_hotel'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  
  // Status Flow
  status: {
    type: String,
    enum: [
      'pending',       // Just booked, awaiting confirmation
      'confirmed',     // Auto-confirmed by system
      'checked_in',    // Guest arrived
      'checked_out',   // Guest departed
      'cancelled',     // Cancelled by customer/admin
      'no_show'        // Guest didn't arrive
    ],
    default: 'pending'
  },
  
  // Front-Desk Tracking
  checkedInAt: Date,
  checkedOutAt: Date,
  checkedInBy: { type: ObjectId, ref: 'User' },  // hotel owner who checked in
  specialRequests: String,
  
  // WhatsApp Notifications
  whatsappSent: {
    confirmation: { type: Boolean, default: false },
    checkInReminder: { type: Boolean, default: false },
    checkOutReminder: { type: Boolean, default: false },
    cancellation: { type: Boolean, default: false }
  },
  
  // Audit
  cancelledAt: Date,
  cancelReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// INDEXES
bookingSchema.index({ bookingId: 1 }, { unique: true });
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ hotelId: 1, status: 1 });
bookingSchema.index({ hotelOwnerId: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
```

### 4.6 Date Blocking Collection (`date_blocks`)

```javascript
const dateBlockSchema = {
  _id: ObjectId,
  hotelId: { type: ObjectId, ref: 'Hotel', required: true },
  roomTypeId: { type: ObjectId, ref: 'RoomType' },  // null = all rooms
  
  // Date Range to Block
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, enum: ['maintenance', 'holiday', 'full_booked', 'custom'] },
  note: String,
  
  createdBy: { type: ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
};

// INDEXES
dateBlockSchema.index({ hotelId: 1, startDate: 1, endDate: 1 });
```

### 4.7 WhatsApp Message Log Collection (`whatsapp_logs`)

```javascript
const whatsappLogSchema = {
  _id: ObjectId,
  
  // Message Details
  messageType: {
    type: String,
    enum: [
      'booking_confirmation_customer',
      'booking_confirmation_owner',
      'check_in_notification',
      'check_out_notification',
      'cancellation_customer',
      'cancellation_owner',
      'admin_alert'
    ],
    required: true
  },
  
  // Related Entities
  bookingId: { type: ObjectId, ref: 'Booking' },
  hotelId: { type: ObjectId, ref: 'Hotel' },
  
  // Recipient
  recipientPhone: { type: String, required: true },
  recipientRole: { type: String, enum: ['customer', 'hotel_owner', 'super_admin'] },
  
  // Message Content
  messageBody: { type: String, required: true },
  
  // Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  errorMessage: String,
  provider: { type: String, enum: ['twilio', 'wati'], default: 'wati' },
  providerMessageId: String,
  
  createdAt: { type: Date, default: Date.now }
};

// INDEXES
whatsappLogSchema.index({ bookingId: 1 });
whatsappLogSchema.index({ recipientPhone: 1 });
whatsappLogSchema.index({ status: 1 });
whatsappLogSchema.index({ createdAt: -1 });
```

---

## 5. API ENDPOINTS ARCHITECTURE

### 5.1 Authentication Endpoints

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/api/auth/register` | Register new customer account | No | Public |
| POST | `/api/auth/login` | Login (email + password) | No | Public |
| POST | `/api/auth/hotel-login` | Hotel Owner login (ID + Password) | No | Public |
| POST | `/api/auth/logout` | Logout session | Yes | All |
| GET | `/api/auth/me` | Get current user profile | Yes | All |
| PUT | `/api/auth/me` | Update profile | Yes | All |

### 5.2 Super Admin Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard` | Get admin dashboard stats | Super Admin |
| GET | `/api/admin/users` | List all users | Super Admin |
| PUT | `/api/admin/users/:id/suspend` | Suspend user | Super Admin |
| GET | `/api/admin/hotel-owners` | List all hotel owners | Super Admin |
| POST | `/api/admin/hotel-owners` | Create hotel owner + generate credentials | Super Admin |
| PUT | `/api/admin/hotel-owners/:id/approve` | Approve/reject hotel owner | Super Admin |
| PUT | `/api/admin/hotel-owners/:id/regenerate-credentials` | Regenerate login ID/password | Super Admin |
| DELETE | `/api/admin/hotel-owners/:id` | Remove hotel owner | Super Admin |
| GET | `/api/admin/hotels` | List all hotels (global) | Super Admin |
| DELETE | `/api/admin/hotels/:id` | Delete any hotel | Super Admin |
| GET | `/api/admin/bookings` | All bookings with filters | Super Admin |
| PUT | `/api/admin/bookings/:id/status` | Override booking status | Super Admin |
| POST | `/api/admin/whatsapp/test` | Test WhatsApp message | Super Admin |
| GET | `/api/admin/whatsapp/logs` | View WhatsApp logs | Super Admin |

### 5.3 Hotel Owner Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/owner/dashboard` | Owner dashboard stats | Hotel Owner |
| GET | `/api/owner/hotels` | List owner's hotels | Hotel Owner |
| POST | `/api/owner/hotels` | Add new hotel | Hotel Owner |
| PUT | `/api/owner/hotels/:id` | Update hotel details | Hotel Owner |
| PUT | `/api/owner/hotels/:id/availability` | Update room availability | Hotel Owner |
| POST | `/api/owner/hotels/:id/block-dates` | Block dates | Hotel Owner |
| DELETE | `/api/owner/hotels/:id/block-dates/:blockId` | Remove date block | Hotel Owner |
| GET | `/api/owner/room-types/:hotelId` | Get room types for hotel | Hotel Owner |
| PUT | `/api/owner/room-types/:id` | Update room type pricing | Hotel Owner |
| GET | `/api/owner/bookings` | List owner's hotel bookings | Hotel Owner |
| PUT | `/api/owner/bookings/:id/check-in` | Mark guest as checked-in | Hotel Owner |
| PUT | `/api/owner/bookings/:id/check-out` | Mark guest as checked-out | Hotel Owner |
| GET | `/api/owner/revenue` | Revenue reports | Hotel Owner |

### 5.4 Customer Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/hotels` | Search hotels (city, dates, guests) | No |
| GET | `/api/hotels/featured` | Get featured hotels | No |
| GET | `/api/hotels/:id` | Get hotel detail + room types | No |
| GET | `/api/hotels/:id/availability` | Check availability for dates | No |
| POST | `/api/bookings` | Create new booking | Customer |
| GET | `/api/bookings/my` | Get customer's bookings | Customer |
| GET | `/api/bookings/:id` | Get booking detail | Customer |
| PUT | `/api/bookings/:id/cancel` | Cancel booking | Customer |

### 5.5 WhatsApp Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/whatsapp/send` | Send custom WhatsApp message | Super Admin |
| GET | `/api/whatsapp/templates` | List WhatsApp templates | Super Admin |
| POST | `/api/whatsapp/webhook` | Receive delivery status callbacks | System |

---

## 6. FRONTEND ROUTE STRUCTURE

### 6.1 Public Routes (No Auth Required)

```
/                          → Landing/Home Page
/hotels                    → Search & List Hotels
/hotels?city=Mumbai        → Filtered by City
/hotels?checkIn=&checkOut= → Date-filtered Search
/hotels/:slug              → Hotel Detail Page
/login                     → Login Page (Role-based redirect)
/register                  → Customer Registration
/hotel-login               → Hotel Owner Login (ID + Password)
/forgot-password           → Password Reset
```

### 6.2 Customer Routes (Auth Required)

```
/bookings                  → My Bookings List
/bookings/:bookingId       → Booking Detail / Confirmation
/profile                   → My Profile / Settings
```

### 6.3 Hotel Owner Routes (Auth Required)

```
/owner                     → Dashboard (Stats overview)
/owner/bookings            → All Bookings for My Hotels
/owner/bookings/:id        → Booking Detail (Check-in/Check-out Actions)
/owner/hotels              → My Hotels List
/owner/hotels/new          → Add New Hotel
/owner/hotels/:id          → Edit Hotel (Profile, Rooms, Images)
/owner/hotels/:id/manage   → Hotel Manager (Pricing, Inventory, Block Dates)
/owner/room-types/:hotelId → Manage Room Types
/owner/revenue             → Revenue Reports
/owner/settings            → Profile & Commission Settings
```

### 6.4 Super Admin Routes (Auth Required)

```
/admin                     → Dashboard (Global Stats)
/admin/users               → All Users Management
/admin/hotel-owners        → Hotel Owners Management
/admin/hotel-owners/new    → Create Hotel Owner + Generate Credentials
/admin/hotel-owners/:id    → Edit/Approve/Suspend Owner
/admin/hotels              → All Hotels (Global View)
/admin/bookings            → All Bookings (Filter/Search)
/admin/whatsapp            → WhatsApp Logs & Test Messages
/admin/settings            → Platform Settings (Commission, Tax, etc.)
```

### 6.5 Next.js App Router Structure

```
app/
├── (public)/
│   ├── page.tsx                    # Home Page
│   ├── hotels/
│   │   ├── page.tsx                # Hotel Listing
│   │   └── [slug]/
│   │       └── page.tsx            # Hotel Detail
│   ├── login/
│   │   └── page.tsx                # Login (Role-based)
│   ├── register/
│   │   └── page.tsx                # Customer Register
│   ├── hotel-login/
│   │   └── page.tsx                # Hotel Owner Login
│   └── layout.tsx                  # Public Layout (Header/Footer)
├── (customer)/
│   ├── bookings/
│   │   ├── page.tsx                # My Bookings
│   │   └── [bookingId]/
│   │       └── page.tsx            # Booking Detail
│   ├── profile/
│   │   └── page.tsx                # My Profile
│   └── layout.tsx                  # Customer Layout
├── (owner)/
│   ├── dashboard/
│   │   └── page.tsx                # Owner Dashboard
│   ├── bookings/
│   │   ├── page.tsx                # Hotel Bookings
│   │   └── [id]/
│   │       └── page.tsx            # Booking Action (Check-in/Out)
│   ├── hotels/
│   │   ├── page.tsx                # My Hotels
│   │   ├── new/
│   │   │   └── page.tsx            # Add Hotel
│   │   └── [id]/
│   │       ├── page.tsx            # Edit Hotel
│   │       └── manage/
│   │           └── page.tsx        # Hotel Manager
│   ├── room-types/
│   │   └── [hotelId]/
│   │       └── page.tsx            # Room Type Management
│   ├── revenue/
│   │   └── page.tsx                # Revenue Reports
│   └── settings/
│       └── page.tsx                # Owner Settings
├── (admin)/
│   ├── dashboard/
│   │   └── page.tsx                # Admin Dashboard
│   ├── users/
│   │   └── page.tsx                # Users Management
│   ├── hotel-owners/
│   │   ├── page.tsx                # Owners List
│   │   ├── new/
│   │   │   └── page.tsx            # Create Owner
│   │   └── [id]/
│   │       └── page.tsx            # Edit Owner
│   ├── hotels/
│   │   └── page.tsx                # Global Hotels
│   ├── bookings/
│   │   └── page.tsx                # All Bookings
│   ├── whatsapp/
│   │   └── page.tsx                # WhatsApp Logs & Test
│   └── settings/
│       └── page.tsx                # Platform Settings
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/
│   │   │   └── route.ts            # NextAuth Configuration
│   │   ├── register/route.ts
│   │   ├── hotel-login/route.ts
│   │   └── me/route.ts
│   ├── admin/
│   │   ├── dashboard/route.ts
│   │   ├── users/route.ts
│   │   ├── hotel-owners/route.ts
│   │   ├── hotels/route.ts
│   │   ├── bookings/route.ts
│   │   └── whatsapp/route.ts
│   ├── owner/
│   │   ├── dashboard/route.ts
│   │   ├── hotels/route.ts
│   │   ├── bookings/route.ts
│   │   └── revenue/route.ts
│   ├── bookings/route.ts
│   └── hotels/route.ts
└── layout.tsx                      # Root Layout
```

---

## 7. AUTHENTICATION & ROLE MANAGEMENT

### 7.1 Unified Login Flow

```
                    ┌─────────────────────────────┐
                    │     /login Page              │
                    │  Email + Password + Role     │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  NextAuth.js / Auth.js       │
                    │  CredentialsProvider         │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Validate Credentials        │
                    │  Check email + password hash │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Fetch User Role from DB     │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Generate JWT with Role      │
                    │  { id, role, email, name }   │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Redirect Based on Role      │
                    │                              │
                    │  Super Admin  →  /admin      │
                    │  Hotel Owner  →  /owner      │
                    │  Customer     →  /           │
                    └─────────────────────────────┘
```

### 7.2 Hotel Owner Custom Login (ID + Password)

```
                    ┌─────────────────────────────┐
                    │   /hotel-login Page           │
                    │   Login ID + Password         │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Find owner by loginId       │
                    │  in hotel_owners collection  │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Validate password (bcrypt)  │
                    │  Check status === 'active'   │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Create session JWT          │
                    │  Redirect to /owner/dashboard│
                    └─────────────────────────────┘
```

### 7.3 Role-Based Middleware (Next.js)

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname;
      
      // Public routes
      if (path.startsWith('/_next') || path === '/' || 
          path.startsWith('/hotels') || path.startsWith('/login') ||
          path.startsWith('/register') || path.startsWith('/hotel-login')) {
        return true;
      }
      
      // Admin routes
      if (path.startsWith('/admin')) {
        return token?.role === 'super_admin';
      }
      
      // Owner routes
      if (path.startsWith('/owner')) {
        return token?.role === 'hotel_owner';
      }
      
      // Customer routes
      if (path.startsWith('/bookings') || path.startsWith('/profile')) {
        return token?.role === 'customer' || token?.role === 'super_admin';
      }
      
      return !!token;
    },
  },
});
```

---

## 8. SUPER ADMIN PANEL

### 8.1 Dashboard Stats

```
┌─────────────────────────────────────────────────────────────┐
│  Master Admin Engine                                          │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Total    │  │  Active  │  │  Total   │  │  Total   │     │
│  │ Hotels   │  │ Bookings │  │  Users   │  │ Revenue  │     │
│  │   245    │  │   1,892  │  │  12.4K   │  │  ₹2.4Cr  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────────┐     │
│  │ Pending  │  │  Hotel   │  │ Recent Bookings (10)     │     │
│  │ Owners   │  │  Owners  │  │ ┌─────────────────┐     │     │
│  │    12    │  │    87    │  │ │bk-001 ✓ Confirmed│     │     │
│  └──────────┘  └──────────┘  │ │bk-002 ✓ CheckedIn│     │     │
│                               │ │bk-003 ✗ Cancelled│     │     │
│                               │ └─────────────────┘     │     │
│                               └─────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Admin Operations

| Operation | Description | UI Element |
|-----------|-------------|------------|
| **Create Hotel Owner** | Manual creation with auto-generated credentials | Form → Generate Login ID + Password |
| **Approve/Reject** | Approve pending hotel owners | Toggle/Suspend button |
| **View All Hotels** | Global list with search/filter | Data table with actions |
| **Edit/Delete Hotel** | Modify any hotel or remove | Modal confirmation |
| **View All Bookings** | Filter by hotel, date range, status | Data table |
| **Override Booking** | Force cancel or complete booking | Modal with reason |
| **WhatsApp Logs** | See all sent messages and delivery status | Data table |
| **Send Test Message** | Test WhatsApp connectivity | Form with phone + message |

### 8.3 Hotel Owner Credential Generation

```typescript
// Auto-Generate Login ID Algorithm
function generateLoginId(ownerName: string, hotelCity: string): string {
  const prefix = "HTL";
  const cityCode = hotelCity.substring(0, 3).toUpperCase();
  const namePart = ownerName.substring(0, 4).toUpperCase();
  const serial = Math.floor(100 + Math.random() * 899);  // 3 digits
  return `${prefix}_${cityCode}_${namePart}_${serial}`;
  // Example: "HTL_MUM_RAJH_742"
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  let pwd = '';
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
  // Example: "Ht8$kLm9@P"
}
```

---

## 9. HOTEL OWNER PANEL

### 9.1 Owner Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome, Raj Hotels 🏨                                       │
│  Commission: 15%  |  Joined: Jan 2026                        │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐ │
│  │ My Hotels  │  │  Total     │  │  Active    │  │ Total  │ │
│  │     4      │  │  Bookings  │  │  Stays     │  │Revenue │ │
│  │            │  │    156     │  │    12      │  │ ₹12.4L │ │
│  └────────────┘  └────────────┘  └────────────┘  └────────┘ │
│                                                               │
│  Tabs: [My Properties] [Booking Orders] [Inventory & Rates]   │
│        [+ Add Property]                                       │
│                                                               │
│  ┌─ My Properties (Table) ────────────────────────────────┐   │
│  │ Hotel Name  │ City  │ Price │ Rooms  │ Status │ Actions│   │
│  │ Grand Palace│ Mumbai│ ₹3500 │ 24/30  │ Active │ Manage │   │
│  │ Sea View    │ Goa   │ ₹5500 │ 10/15  │ Active │ Manage │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Front-Desk Check-In / Check-Out

```typescript
// Check-In Operation
async function checkInGuest(bookingId: string, ownerId: string) {
  const booking = await Booking.findById(bookingId)
    .populate('hotelId');
  
  // Validation
  if (booking.hotelOwnerId.toString() !== ownerId) {
    throw new Error('Unauthorized: Not your hotel booking');
  }
  if (booking.status !== 'confirmed') {
    throw new Error('Booking must be in "confirmed" status');
  }
  
  // Update booking
  booking.status = 'checked_in';
  booking.checkedInAt = new Date();
  booking.checkedInBy = ownerId;
  await booking.save();
  
  // Update hotel available rooms
  await Hotel.findByIdAndUpdate(booking.hotelId, {
    $inc: { availableRooms: -1 }
  });
  
  // Send WhatsApp notification
  await sendWhatsAppMessage({
    to: booking.customerPhone,
    template: 'check_in_confirmation',
    variables: {
      customerName: booking.customerName,
      hotelName: booking.hotelName,
      checkIn: booking.checkIn,
      roomType: booking.roomTypeName
    }
  });
  
  return booking;
}

// Check-Out Operation
async function checkOutGuest(bookingId: string, ownerId: string) {
  const booking = await Booking.findById(bookingId);
  
  if (booking.hotelOwnerId.toString() !== ownerId) {
    throw new Error('Unauthorized');
  }
  if (booking.status !== 'checked_in') {
    throw new Error('Guest must be checked-in first');
  }
  
  booking.status = 'checked_out';
  booking.checkedOutAt = new Date();
  await booking.save();
  
  // Update hotel available rooms
  await Hotel.findByIdAndUpdate(booking.hotelId, {
    $inc: { availableRooms: 1 }
  });
  
  // Send WhatsApp notification
  await sendWhatsAppMessage({
    to: booking.customerPhone,
    template: 'check_out_notification',
    variables: {
      customerName: booking.customerName,
      hotelName: booking.hotelName,
      checkOut: booking.checkOut,
      thanksMessage: 'Thank you for staying with us!'
    }
  });
  
  return booking;
}
```

### 9.3 Inventory Control & Date Blocking

```typescript
// Block Dates (e.g., for maintenance or holidays)
async function blockDates(hotelId: string, ownerId: string, data: {
  startDate: Date;
  endDate: Date;
  reason: 'maintenance' | 'holiday' | 'full_booked' | 'custom';
  note?: string;
}) {
  // Verify ownership
  const hotel = await Hotel.findById(hotelId);
  if (hotel.hotelOwnerId.toString() !== ownerId) {
    throw new Error('Unauthorized');
  }
  
  const block = await DateBlock.create({
    hotelId,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
    note: data.note,
    createdBy: ownerId
  });
  
  return block;
}

// Check if dates are available
async function checkAvailability(hotelId: string, checkIn: Date, checkOut: Date) {
  // Find overlapping date blocks
  const blocks = await DateBlock.find({
    hotelId,
    startDate: { $lte: checkOut },
    endDate: { $gte: checkIn }
  });
  
  // Find existing confirmed bookings for those dates
  const existingBookings = await Booking.find({
    hotelId,
    status: { $in: ['confirmed', 'checked_in'] },
    $or: [
      { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
    ]
  });
  
  const hotel = await Hotel.findById(hotelId);
  const bookedRooms = existingBookings.length;
  const available = hotel.availableRooms - bookedRooms;
  
  return {
    available: available > 0 && blocks.length === 0,
    availableRooms: Math.max(0, available),
    totalRooms: hotel.totalRooms,
    dateBlocked: blocks.length > 0,
    blockReason: blocks[0]?.reason
  };
}
```

---

## 10. CUSTOMER FRONTEND & BOOKING FLOW

### 10.1 Booking Flow Diagram

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Search   │    │  Select  │    │  Fill    │    │  Confirm │
│  Hotels   │───▶│  Dates   │───▶│  Details │───▶│  Booking │
│           │    │  & Room  │    │  & Guest │    │  (Pay at │
│           │    │          │    │  Info    │    │  Hotel)  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │  Booking Created   │
                                          │  status: confirmed │
                                          └─────────┬─────────┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │  WhatsApp Sent     │
                                          │  ✓ Confirmation    │
                                          │  ✓ Booking Details │
                                          └─────────┬─────────┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │  Email Sent        │
                                          │  ✓ Booking Summary │
                                          └───────────────────┘
```

### 10.2 Price Calculation Logic

```typescript
function calculateBookingPrice(
  basePrice: number,
  multiplier: number,
  nights: number,
  guests: number,
  taxRate: number = 12
): BookingPriceBreakdown {
  const effectivePricePerNight = Math.round(basePrice * multiplier);
  const subtotal = effectivePricePerNight * nights;
  
  // Extra guest charges (if applicable)
  // Assuming standard capacity is 2, extra guest charge is 500/night
  const extraGuests = Math.max(0, guests - 2);
  const extraGuestCharges = extraGuests * 500 * nights;
  
  const taxableAmount = subtotal + extraGuestCharges;
  const taxAmount = Math.round(taxableAmount * taxRate / 100);
  const totalAmount = taxableAmount + taxAmount;
  
  return {
    basePricePerNight: basePrice,
    roomTypeMultiplier: multiplier,
    effectivePricePerNight,
    extraGuestCharges,
    nights,
    subtotal: taxableAmount,
    taxRate,
    taxAmount,
    totalAmount
  };
}
```

### 10.3 Booking Creation API Logic

```typescript
// POST /api/bookings
async function createBooking(req: Request, userId: string) {
  const {
    hotelId, roomTypeId, checkIn, checkOut,
    guests, specialRequests
  } = await req.json();
  
  // 1. Validate hotel exists and is active
  const hotel = await Hotel.findById(hotelId);
  if (!hotel || hotel.status !== 'active') {
    throw new Error('Hotel not available');
  }
  
  // 2. Validate room type
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType || roomType.status !== 'active') {
    throw new Error('Room type not available');
  }
  
  // 3. Check date availability
  const availability = await checkAvailability(hotelId, checkIn, checkOut);
  if (!availability.available) {
    throw new Error('Rooms not available for selected dates');
  }
  
  // 4. Calculate dates
  const nights = Math.max(1, Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) 
    / (1000 * 60 * 60 * 24)
  ));
  
  // 5. Get customer info
  const user = await User.findById(userId);
  
  // 6. Calculate price
  const pricing = calculateBookingPrice(
    roomType.basePrice,
    roomType.priceMultiplier,
    nights,
    guests
  );
  
  // 7. Generate booking ID
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const bookingId = `BETO-${dateStr}-${randomStr}`;
  
  // 8. Create booking
  const booking = await Booking.create({
    bookingId,
    customerId: userId,
    customerName: user.name,
    customerEmail: user.email,
    customerPhone: user.phone,
    hotelId,
    hotelOwnerId: hotel.hotelOwnerId,
    hotelName: hotel.name,
    roomTypeId,
    roomTypeName: roomType.name,
    checkIn,
    checkOut,
    guests,
    nights,
    basePricePerNight: pricing.basePricePerNight,
    roomTypeMultiplier: pricing.roomTypeMultiplier,
    effectivePricePerNight: pricing.effectivePricePerNight,
    subtotal: pricing.subtotal,
    taxRate: pricing.taxRate,
    taxAmount: pricing.taxAmount,
    totalAmount: pricing.totalAmount,
    paymentMethod: 'pay_at_hotel',
    paymentStatus: 'pending',
    status: 'confirmed',
    specialRequests
  });
  
  // 9. Update hotel available rooms
  await Hotel.findByIdAndUpdate(hotelId, {
    $inc: { availableRooms: -1 }
  });
  
  // 10. Send WhatsApp notifications
  await sendBookingConfirmation(booking);
  await sendOwnerNotification(booking);
  
  return booking;
}
```

---

## 11. WHATSAPP NOTIFICATION SYSTEM

### 11.1 Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     WHATSAPP SERVICE MODULE                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   WhatsApp Provider (WATI/Twilio)          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│            ┌──────────────┼──────────────┐                      │
│            ▼              ▼              ▼                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Send Message │ │Send Template │ │  Webhook     │            │
│  │ (Text)       │ │ (Structured)  │ │  (Callbacks) │            │
│  └──────────────┘ └──────────────┘ └──────┬───────┘            │
│                                           │                      │
│                                    ┌──────▼───────┐            │
│                                    │  Update Log  │            │
│                                    │  Delivery    │            │
│                                    │  Status      │            │
│                                    └──────────────┘            │
│                                                                  │
│  TRIGGER POINTS:                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Booking     │  │ Check-In    │  │ Check-Out   │             │
│  │ Confirmed   │  │ Completed   │  │ Completed   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Booking     │  │ Owner       │  │ Admin Alert  │             │
│  │ Cancelled   │  │ New Booking │  │ (Errors)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└────────────────────────────────────────────────────────────────┘
```

### 11.2 WhatsApp Templates (WATI.io)

```typescript
const WHATSAPP_TEMPLATES = {
  // ===== CUSTOMER TEMPLATES =====
  
  booking_confirmation_customer: {
    templateName: 'booking_confirmation',
    parameters: [
      '{{1}}',  // Customer Name
      '{{2}}',  // Hotel Name
      '{{3}}',  // Booking ID
      '{{4}}',  // Check-In Date
      '{{5}}',  // Check-Out Date
      '{{6}}',  // Room Type
      '{{7}}',  // Total Amount
      '{{8}}',  // Nights
      '{{9}}',  // Guests
    ],
    message: `🏨 *Booking Confirmed!*
    
Hi {{1}},

Your booking at *{{2}}* is confirmed!

📋 *Booking ID:* {{3}}
📅 *Check-In:* {{4}}
📅 *Check-Out:* {{5}}
🛏️ *Room:* {{6}}
👥 *Guests:* {{9}}
🌙 *Nights:* {{8}}
💰 *Total:* ₹{{7}}

💳 *Payment:* Pay at Hotel (Cash/On-Arrival)

📍 *Address:* Will be shared by hotel

Thank you for choosing Beto! 🙏`
  },

  check_in_confirmation: {
    templateName: 'check_in_confirmation',
    parameters: [
      '{{1}}',  // Customer Name
      '{{2}}',  // Hotel Name
      '{{3}}',  // Room Type
      '{{4}}',  // Room Number
    ],
    message: `✅ *Checked In!*
    
Hi {{1}},

You have been successfully checked in at *{{2}}*.

🛏️ *Room:* {{3}}
🔑 *Key:* Received at reception

Wishing you a comfortable stay! 🌟

*Beto Team*`
  },

  check_out_notification: {
    templateName: 'check_out_notification',
    parameters: [
      '{{1}}',  // Customer Name
      '{{2}}',  // Hotel Name
    ],
    message: `👋 *Checked Out!*
    
Hi {{1}},

You have been successfully checked out from *{{2}}*.

Thank you for staying with us! We hope to see you again soon.

⭐ *Rate your stay:* Share your feedback on Beto

*Safe travels! 🌍*
*Beto Team*`
  },

  booking_cancellation_customer: {
    templateName: 'booking_cancellation',
    parameters: [
      '{{1}}',  // Customer Name
      '{{2}}',  // Hotel Name
      '{{3}}',  // Booking ID
    ],
    message: `❌ *Booking Cancelled*
    
Hi {{1}},

Your booking at *{{2}}* has been cancelled.

📋 *Booking ID:* {{3}}

If this was done by mistake, please rebook on Beto.

*Beto Team*`
  },

  // ===== HOTEL OWNER TEMPLATES =====
  
  new_booking_owner: {
    templateName: 'new_booking_owner',
    parameters: [
      '{{1}}',  // Owner Name
      '{{2}}',  // Hotel Name
      '{{3}}',  // Customer Name
      '{{4}}',  // Booking ID
      '{{5}}',  // Check-In
      '{{6}}',  // Check-Out
      '{{7}}',  // Room Type
      '{{8}}',  // Amount
    ],
    message: `🆕 *New Booking!*
    
Hi {{1}},

You have a new booking at *{{2}}*!

👤 *Guest:* {{3}}
📋 *ID:* {{4}}
📅 *Check-In:* {{5}}
📅 *Check-Out:* {{6}}
🛏️ *Room:* {{7}}
💰 *Amount:* ₹{{8}}

Please prepare for the guest's arrival.`
  },

  // ===== ADMIN TEMPLATES =====
  
  admin_alert: {
    templateName: 'admin_alert',
    parameters: [
      '{{1}}',  // Alert Type
      '{{2}}',  // Description
    ],
    message: `⚠️ *Admin Alert*
    
*Type:* {{1}}
*Details:* {{2}}

Please check the admin panel for details.`
  }
};
```

### 11.3 WhatsApp Service Implementation

```typescript
// services/whatsapp.service.ts

export class WhatsAppService {
  private provider: 'wati' | 'twilio';
  private apiKey: string;
  private watiEndpoint: string = 'https://live.wati.io/api/v1';

  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER as any || 'wati';
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
  }

  // ===== SEND STRUCTURED MESSAGE =====
  async sendStructuredMessage(params: {
    to: string;           // Phone with country code, e.g., "+919876543210"
    templateName: string;
    parameters: string[];
    bookingId?: string;
    hotelId?: string;
  }): Promise<WhatsAppResult> {
    
    let result: WhatsAppResult;
    
    if (this.provider === 'wati') {
      result = await this.sendViaWATI(params);
    } else {
      result = await this.sendViaTwilio(params);
    }
    
    // Log to database
    await this.logMessage({
      messageType: this.getMessageType(params.templateName),
      bookingId: params.bookingId,
      hotelId: params.hotelId,
      recipientPhone: params.to,
      recipientRole: this.getRecipientRole(params.templateName),
      messageBody: result.messageBody,
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.error,
      provider: this.provider,
      providerMessageId: result.providerMessageId
    });
    
    return result;
  }

  // ===== SEND VIA WATI =====
  private async sendViaWATI(params: {
    to: string;
    templateName: string;
    parameters: string[];
  }): Promise<WhatsAppResult> {
    try {
      const response = await fetch(
        `${this.watiEndpoint}/sendTemplateMessage?whatsappNumber=${params.to}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template_name: params.templateName,
            broadcast_name: 'beto_auto',
            parameters: params.parameters.map((val, i) => ({
              name: String(i + 1),
              value: val
            }))
          })
        }
      );
      
      const data = await response.json();
      return {
        success: response.ok,
        providerMessageId: data?.result?.messageId,
        messageBody: this.buildPreviewMessage(params),
        error: data?.error || null
      };
    } catch (error: any) {
      return {
        success: false,
        providerMessageId: null,
        messageBody: this.buildPreviewMessage(params),
        error: error.message
      };
    }
  }

  // ===== SEND VIA TWILIO =====
  private async sendViaTwilio(params: {
    to: string;
    templateName: string;
    parameters: string[];
  }): Promise<WhatsAppResult> {
    // Twilio WhatsApp API implementation
    // Uses Twilio's Content SID for templates
    // For demo purposes, this sends a basic text message
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM;
      
      const messageBody = this.buildPreviewMessage(params);
      
      // Twilio would be called here
      // const twilioClient = require('twilio')(accountSid, authToken);
      // const msg = await twilioClient.messages.create({
      //   body: messageBody,
      //   from: `whatsapp:${from}`,
      //   to: `whatsapp:${params.to}`
      // });
      
      return {
        success: true,
        providerMessageId: `twilio-${Date.now()}`,
        messageBody,
        error: null
      };
    } catch (error: any) {
      return {
        success: false,
        providerMessageId: null,
        messageBody: this.buildPreviewMessage(params),
        error: error.message
      };
    }
  }

  // ===== LOG MESSAGE =====
  private async logMessage(data: {
    messageType: string;
    bookingId?: string;
    hotelId?: string;
    recipientPhone: string;
    recipientRole: string;
    messageBody: string;
    status: string;
    errorMessage?: string;
    provider: string;
    providerMessageId?: string;
  }): Promise<void> {
    await WhatsAppLog.create(data);
  }

  // ===== HELPERS =====
  
  private buildPreviewMessage(params: {
    templateName: string;
    parameters: string[];
  }): string {
    const template = WHATSAPP_TEMPLATES[params.templateName];
    if (!template) return 'Message content unavailable';
    
    let msg = template.message;
    params.parameters.forEach((val, idx) => {
      msg = msg.replace(`{{${idx + 1}}}`, val);
    });
    return msg;
  }

  private getMessageType(templateName: string): string {
    const typeMap: Record<string, string> = {
      'booking_confirmation': 'booking_confirmation_customer',
      'check_in_confirmation': 'check_in_notification',
      'check_out_notification': 'check_out_notification',
      'booking_cancellation': 'cancellation_customer',
      'new_booking_owner': 'booking_confirmation_owner',
      'admin_alert': 'admin_alert'
    };
    return typeMap[templateName] || 'admin_alert';
  }

  private getRecipientRole(templateName: string): string {
    if (templateName.includes('owner') || templateName.includes('Owner')) return 'hotel_owner';
    if (templateName === 'admin_alert') return 'super_admin';
    return 'customer';
  }
}

// Singleton export
export const whatsappService = new WhatsAppService();
```

### 11.4 Notification Trigger Points

| Trigger Point | Template | Recipient | When |
|---------------|----------|-----------|------|
| **Booking Created** | `booking_confirmation` | Customer | Immediately after booking |
| **Booking Created** | `new_booking_owner` | Hotel Owner | Immediately after booking |
| **Check-In** | `check_in_confirmation` | Customer | When owner marks checked-in |
| **Check-Out** | `check_out_notification` | Customer | When owner marks checked-out |
| **Booking Cancelled** | `booking_cancellation` | Customer | When booking is cancelled |
| **Booking Cancelled** | `booking_cancellation_owner` | Hotel Owner | When booking is cancelled |
| **Suspicious Activity** | `admin_alert` | Super Admin | On error or fraud detection |

### 11.5 Webhook Handler (Delivery Status)

```typescript
// POST /api/whatsapp/webhook
async function handleWebhook(req: Request) {
  const payload = await req.json();
  
  // WATI webhook format
  const { messageId, status, phoneNumber } = payload;
  
  // Update log
  await WhatsAppLog.findOneAndUpdate(
    { providerMessageId: messageId },
    { 
      status: status === 'read' ? 'read' 
            : status === 'delivered' ? 'delivered'
            : status === 'failed' ? 'failed'
            : 'sent'
    }
  );
  
  return { received: true };
}
```

---

## 12. DATABASE RELATIONSHIPS DIAGRAM

```
┌──────────────────┐       ┌──────────────────────┐
│      User        │       │    HotelOwner         │
│──────────────────│       │──────────────────────│
│ _id              │──1:1──│ _id                   │
│ uid              │       │ userId (ref: User)    │──1:N──┐
│ name             │       │ companyName           │      │
│ email            │       │ ownerName             │      │
│ phone            │       │ loginId (unique)      │      │
│ role             │       │ loginPassword (hash)  │      │
│ status           │       │ commissionRate        │      │
│ hotelOwnerId     │       │ status                │      │
│ createdAt        │       │ approvedBy            │      │
└──────────────────┘       └──────────────────────┘      │
        │                                                  │
        │ 1:N                                               │
        │                                                  │
        ▼                                                  │
┌──────────────────┐       ┌──────────────────────┐      │
│    Booking        │       │      Hotel           │      │
│──────────────────│       │──────────────────────│      │
│ _id              │──N:1──│ _id                   │◄─────┘
│ bookingId        │       │ hotelOwnerId          │
│ customerId       │       │ name, slug            │
│ customerName     │       │ city, state           │
│ customerPhone    │       │ basePrice             │
│ hotelId          │──N:1──│ totalRooms            │
│ hotelOwnerId     │       │ availableRooms        │
│ roomTypeId       │       │ status, featured      │
│ checkIn, checkOut│       │ amenities             │
│ guests, nights   │       │ policies              │
│ totalAmount      │       └──────────┬───────────┘
│ status           │                  │
│ paymentMethod    │                  │ 1:N
│ whatsappSent     │                  │
│ createdAt        │                  ▼
└──────────────────┘       ┌──────────────────────┐
                           │     RoomType          │
                           │──────────────────────│
┌──────────────────┐       │ _id                  │
│   DateBlock       │       │ hotelId              │
│──────────────────│       │ name                 │
│ _id              │       │ capacity             │
│ hotelId          │──N:1──│ basePrice            │
│ roomTypeId       │       │ priceMultiplier      │
│ startDate        │       │ totalRooms           │
│ endDate          │       │ availableRooms       │
│ reason           │       │ amenities            │
│ createdAt        │       │ status               │
└──────────────────┘       └──────────────────────┘

┌──────────────────┐
│  WhatsAppLog      │
│──────────────────│
│ _id              │
│ messageType      │
│ bookingId        │──N:1
│ hotelId          │──N:1
│ recipientPhone   │
│ messageBody      │
│ status           │
│ provider         │
│ createdAt        │
└──────────────────┘
```

---

## 13. FILE/FOLDER STRUCTURE

```
beto-hotel-booking/
├── .env                          # Environment Variables
├── .env.example                  # Example Env
├── .gitignore
├── next.config.js                # Next.js Configuration
├── tailwind.config.ts            # Tailwind Configuration
├── tsconfig.json                 # TypeScript Configuration
├── package.json
├── README.md
│
├── prisma/                       # Prisma Schema (if PostgreSQL)
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root Layout
│   │   ├── page.tsx              # Home Page
│   │   │
│   │   ├── (public)/             # Public Routes Layout
│   │   │   ├── layout.tsx
│   │   │   ├── hotels/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── hotel-login/
│   │   │
│   │   ├── (customer)/           # Customer Routes Layout
│   │   │   ├── layout.tsx
│   │   │   ├── bookings/
│   │   │   └── profile/
│   │   │
│   │   ├── (owner)/              # Hotel Owner Routes Layout
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── bookings/
│   │   │   ├── hotels/
│   │   │   ├── room-types/
│   │   │   ├── revenue/
│   │   │   └── settings/
│   │   │
│   │   ├── (admin)/              # Super Admin Routes Layout
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── hotel-owners/
│   │   │   ├── hotels/
│   │   │   ├── bookings/
│   │   │   ├── whatsapp/
│   │   │   └── settings/
│   │   │
│   │   └── api/                  # API Routes
│   │       ├── auth/
│   │       ├── admin/
│   │       ├── owner/
│   │       ├── bookings/
│   │       └── hotels/
│   │
│   ├── components/               # Reusable Components
│   │   ├── ui/                   # Base UI Components (shadcn)
│   │   ├── forms/                # Form Components
│   │   ├── layout/               # Layout Components
│   │   ├── hotels/               # Hotel-specific Components
│   │   ├── bookings/             # Booking-specific Components
│   │   └── whatsapp/             # WhatsApp-related Components
│   │
│   ├── lib/                      # Library/Utility Functions
│   │   ├── auth.ts               # Auth Utilities
│   │   ├── db.ts                 # Database Connection
│   │   ├── utils.ts              # General Utilities
│   │   └── validations.ts        # Zod Validations
│   │
│   ├── models/                   # MongoDB Models (if using Mongoose)
│   │   ├── User.ts
│   │   ├── HotelOwner.ts
│   │   ├── Hotel.ts
│   │   ├── RoomType.ts
│   │   ├── Booking.ts
│   │   ├── DateBlock.ts
│   │   └── WhatsAppLog.ts
│   │
│   ├── services/                 # Business Logic Services
│   │   ├── auth.service.ts
│   │   ├── booking.service.ts
│   │   ├── hotel.service.ts
│   │   ├── whatsapp.service.ts
│   │   └── notification.service.ts
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useAuth.ts
│   │   ├── useBookings.ts
│   │   └── useHotels.ts
│   │
│   ├── store/                    # Zustand Stores
│   │   ├── authStore.ts
│   │   └── bookingStore.ts
│   │
│   └── types/                    # TypeScript Types
│       ├── index.ts
│       ├── user.ts
│       ├── hotel.ts
│       ├── booking.ts
│       └── whatsapp.ts
│
├── public/                       # Static Assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── tests/                        # Test Files
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 14. DEPLOYMENT CHECKLIST

### 14.1 Pre-Launch Checklist

| # | Item | Status |
|---|------|--------|
| 1 | **Database Setup** — MongoDB Atlas / PostgreSQL | ☐ |
| 2 | **Redis Setup** — Upstash / Redis Cloud | ☐ |
| 3 | **Environment Variables** — All secrets configured | ☐ |
| 4 | **NextAuth Configuration** — JWT secret, providers | ☐ |
| 5 | **WhatsApp Provider** — WATI.io / Twilio account + templates | ☐ |
| 6 | **WhatsApp Templates** — All templates approved by Meta | ☐ |
| 7 | **SMTP Configuration** — Email sending for registration | ☐ |
| 8 | **File Storage** — Cloudinary / S3 bucket for images | ☐ |
| 9 | **SSL Certificate** — HTTPS enabled | ☐ |
| 10 | **Domain Setup** — DNS configured | ☐ |
| 11 | **Vercel Deployment** — Connected to Git repo | ☐ |
| 12 | **Database Migration** — Run Prisma migrations / create indexes | ☐ |
| 13 | **Seed Data** — Admin user, sample hotels | ☐ |
| 14 | **Rate Limiting** — API rate limits configured | ☐ |
| 15 | **Error Monitoring** — Sentry / LogRocket setup | ☐ |

### 14.2 Environment Variables

```bash
# === AUTHENTICATION ===
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secret-key

# === DATABASE (Choose One) ===
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/beto
# PostgreSQL
DATABASE_URL=postgresql://user:pass@host:5432/beto

# === REDIS ===
REDIS_URL=redis://default:pass@host:6379

# === WHATSAPP (WATI.io) ===
WHATSAPP_PROVIDER=wati
WATI_API_KEY=your-wati-api-key
WATI_ENDPOINT=https://live.wati.io/api/v1

# === WHATSAPP (Twilio - Alternative) ===
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_FROM=+14155238886

# === FILE STORAGE ===
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# === SMTP (Email) ===
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-key
EMAIL_FROM=noreply@beto.com

# === PLATFORM ===
NEXT_PUBLIC_APP_NAME=Beto
NEXT_PUBLIC_APP_URL=https://yourdomain.com
PLATFORM_COMMISSION=15
PLATFORM_TAX_RATE=12
```

---

## APPENDIX: Quick Start Implementation Order

### Phase 1: Foundation (Days 1-3)
1. Initialize Next.js project with TypeScript + Tailwind
2. Set up database (MongoDB/PostgreSQL)
3. Create all Mongoose/Prisma models
4. Implement NextAuth.js with credentials provider
5. Create auth middleware for role-based access
6. Set up Redis for session caching

### Phase 2: Admin Panel (Days 4-6)
1. Admin dashboard with stats
2. User management (CRUD, suspend)
3. Hotel owner creation with credential generation
4. Global hotel view + CRUD
5. Global booking monitoring with filters

### Phase 3: Hotel Owner Panel (Days 7-10)
1. Owner dashboard with stats
2. Hotel management (add/edit/delete own hotels)
3. Room type management
4. Booking list for own hotels
5. Check-in / Check-out functionality
6. Date blocking & inventory control
7. Custom login (ID + Password)

### Phase 4: Customer Frontend (Days 11-14)
1. Home page with featured hotels
2. Hotel search with filters (city, dates, guests)
3. Hotel detail page with room types
4. Booking flow with "Pay at Hotel"
5. My Bookings page
6. Booking confirmation page

### Phase 5: WhatsApp Integration (Days 15-17)
1. Set up WATI.io / Twilio account
2. Create WhatsApp templates
3. Build WhatsApp service module
4. Integrate triggers at booking, check-in, check-out
5. Webhook handler for delivery status
6. WhatsApp logs view in admin panel

### Phase 6: Polish & Deploy (Days 18-21)
1. Responsive design testing
2. Error boundaries & loading states
3. Form validations (Zod)
4. Rate limiting & security headers
5. SEO optimization
6. Performance optimization (ISR, caching)
7. Deploy to Vercel + production testing

---

> **Document Version:** 1.0.0  
> **Author:** Senior Full-Stack Architect  
> **For questions:** Refer to the inline code comments or file structure above  
> **Happy Coding! 🚀**