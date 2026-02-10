# Mad Monkey eBike Tour Booking System

A full-stack web application for managing eBike tour bookings in Chiang Mai, Thailand.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Shadcn UI, Lucide React
- **Backend**: Next.js Server Actions
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Email**: Nodemailer (SMTP)

## Features

### Public Pages
- Home page with featured tours
- Route detail pages with Komoot map embeds
- Multi-step booking form
- Booking tracking page with payment upload and waiver signature

### Admin Dashboard
- Dashboard with booking statistics
- Booking management with status workflow
- Route CRUD operations
- Email notifications at each booking stage

## Booking Workflow

1. **PENDING_REVIEW** - Customer submits booking request → Acknowledgement email sent
2. **AWAITING_PAYMENT** - Admin approves → Payment request email sent
3. **PAYMENT_UPLOADED** - Customer uploads payment slip and signs waiver
4. **CONFIRMED** - Admin verifies payment → Confirmation email sent
5. **CANCELLED** - Booking cancelled at any stage

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- SMTP credentials (e.g., Gmail, SendGrid SMTP, Mailgun)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL in `supabase/schema.sql` in the SQL Editor
   - Copy your project URL and keys to `.env.local`

4. Create storage buckets in Supabase:
   - `route-images` (public)
   - `payment-slips` (private)
   - `waiver-signatures` (private)

5. Create an admin user:
   - Go to Supabase Auth → Users
   - Add a new user with email/password

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# SMTP (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Mad Monkey eBike Tours
SMTP_FROM_EMAIL=your-email@gmail.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
├── app/
│   ├── (public pages)
│   │   ├── page.tsx              # Home
│   │   ├── tours/[slug]/         # Route detail
│   │   ├── book/[slug]/          # Booking form
│   │   └── track/[token]/        # Tracking page
│   ├── admin/
│   │   ├── page.tsx              # Dashboard
│   │   ├── bookings/             # Booking management
│   │   ├── routes/               # Route CRUD
│   │   └── login/                # Admin login
│   ├── actions/                  # Server actions
│   └── api/                      # API routes
├── components/ui/                # Shadcn UI components
├── lib/
│   ├── supabase/                 # Supabase clients
│   ├── email/                    # Nodemailer config & templates
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utility functions
└── supabase/
    └── schema.sql                # Database schema
```

## Database Schema

### Routes Table
- `id`, `slug`, `title`, `description`
- `difficulty` (Easy, Moderate, Challenging)
- `duration`, `price`
- `cover_image_url`, `komoot_iframe`
- `is_active`

### Bookings Table
- `id`, `tracking_token` (auto-generated)
- `route_id`, `tour_date`, `start_time`
- `customer_name`, `customer_email`, `customer_whatsapp`
- `pax_count`, `participants_info` (JSONB with heights)
- `status`, `payment_slip_url`, `waiver_signature_url`
- `admin_notes`

## Deployment

### Netlify

1. Push to GitHub
2. Connect to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add environment variables

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## License

MIT
