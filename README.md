# GlobeTrotter - Multi-City Travel Planner and Itinerary Platform

**Odoo x LDCE Ahmedabad Hackathon 2026 - Virtual Round Project**

GlobeTrotter is a full-stack, responsive travel planning and itinerary management web application built for modern travelers. It streamlines the end-to-end journey lifecycle—from multi-destination discovery and day-by-day scheduling to collaborative planning, expense tracking with multi-currency conversion, and community itinerary sharing.

---

## Key Highlights

- **Multi-City Itinerary Builder**: Create trips with multiple stops, reorder destination sequences, schedule day-by-day activities, and allocate section budgets.
- **MakeMyTrip-Style Date Range Picker**: Interactive dual-card date range selector with automatic constraints (`endDate >= startDate`), visual month calendar navigation, and quick duration presets (+3 days, 1 week, 2 weeks).
- **3-Tier Trip Visibility & Collaboration**:
  - **Private**: Accessible exclusively to the creator and explicitly invited collaborators.
  - **Shared via Secret Link**: Accessible via unique tokenized URLs (`/trips/share/[shareToken]`) with 1-click collaborator joining and itinerary cloning.
  - **Public**: Discoverable in the community explore feed for public discovery and template copying.
- **Travel Budgeting & Multi-Currency Engine**: Live expense logging per category (Flights, Accommodation, Food, Activities, Transport, Shopping), section budget progress meters, and dynamic currency conversions against real-time exchange rates (INR, USD, EUR, GBP, AED, JPY, AUD, CAD, SGD, THB).
- **Media Upload System**: Dual-mode image handling allowing direct high-resolution file uploads to Supabase Storage buckets or external direct URLs for profile avatars, trip covers, and community posts.
- **Community Feed & Template Cloning**: Social travel hub where travelers publish experiences, link trips and activities, interact through likes and comments, and clone public itineraries as personalized templates.
- **Destination & Activity Catalog**: Filterable global city directory with popularity scores, cost indexes, categorized activities, and community submissions managed via administrative review tools.
- **Zero-Trust Security & Supabase RLS**: Fine-grained PostgreSQL Row Level Security policies with `SECURITY DEFINER` helper functions to avoid recursion and protect user itineraries, expenses, and collaboration states.
- **Pacific Horizon Design System**: Cohesive color palette utilizing Ocean Teal (`#0B4F6C`), Coral Accent (`#FF5A5F`), Sky Highlights (`#0891B2`), and Sand Off-White (`#FDFBF7`) paired with vector Lucide icons.

---

## Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server Actions, Dynamic Streaming) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS v4, Pacific Horizon Design System |
| **Icons** | Lucide React |
| **Database** | PostgreSQL on Supabase |
| **Authentication** | Supabase Auth (Email/Password + Google OAuth) |
| **Storage** | Supabase Storage Buckets (`media`) |
| **Security** | PostgreSQL Row Level Security (RLS) with Security Definer Functions |
| **Build & Tooling** | Turbopack, PostCSS, ESLint |

---

## Database Architecture & Entity Relationships

The relational schema is configured in PostgreSQL under the `public` schema with foreign key constraints, automatic timestamps, and cascade behaviors:

- `profiles`: User account data, roles (`traveler`, `admin`), home locations, preferences, and avatar URLs.
- `trips`: Core trip entities storing dates, estimated budgets, 3-tier visibility flags (`is_public`, `share_token`), and status (`planning`, `upcoming`, `ongoing`, `completed`).
- `trip_stops`: Sequential destination stops per trip with arrival/departure dates, order indices, section budgets, and local notes.
- `trip_activities`: Scheduled activities mapped to specific stops and day numbers with planned costs and scheduled times.
- `trip_collaborators`: Multi-user access control list defining permissions (`view`, `edit`) and invitation states (`pending`, `accepted`, `declined`).
- `expenses`: Itemized travel expenses with currency conversion factors and category tagging.
- `cities`: Global destination catalog with region classifications, popularity metrics, and cost index scores.
- `activities`: Curated and user-submitted activity database with admin approval statuses.
- `community_posts`: Social feed posts with media attachments and references to trips and activities.
- `post_likes` & `post_comments`: Community engagement and discussion records.
- `saved_destinations`: Traveler wishlist and bookmarking records.
- `currency_rates`: Base exchange rates against INR for real-time financial conversions.

---

## Installation & Local Development

### Prerequisites

- Node.js 18.18.0 or higher
- npm 9.0.0 or higher
- Supabase Project (Database, Auth, and Storage enabled)

### 1. Clone the Repository

```bash
git clone https://github.com/urvi-ladhani/Globe-Trotter.git
cd Globe-Trotter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Database & Storage Initialization

1. Execute the schema migration SQL scripts in your Supabase SQL Editor.
2. In Supabase Dashboard, create a public Storage bucket named `media` to support image uploads.
3. Configure RLS storage policies allowing authenticated users to upload and public users to read media objects.

### 5. Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` in your browser.

### 6. Production Build

To verify type safety and generate an optimized production bundle:

```bash
npm run build
npm run start
```

---

## Core Application Routes

| Path | Description | Access |
| :--- | :--- | :--- |
| `/` | Landing page featuring hero banner, destination search, regional carousels, and quick trip links | Public / Authenticated |
| `/login` & `/register` | Authentication portals supporting email credentials and Google OAuth | Public |
| `/onboarding` | Profile initialization collecting travel preferences and home location | Authenticated |
| `/trips` | Personal trip hub managing upcoming, ongoing, and completed trips, plus collaboration invites | Authenticated |
| `/trips/new` | Multi-field trip creation form with MakeMyTrip date range picker and 3-tier visibility settings | Authenticated |
| `/trips/[tripId]` | Comprehensive trip overview with day-by-day timelines, budget summaries, and collaborator access controls | Creator / Collaborator |
| `/trips/[tripId]/build` | Interactive builder to add/reorder destination stops and schedule activities | Creator / Editor |
| `/trips/[tripId]/budget` | Expense ledger with category breakdowns, section progress meters, and dynamic currency conversions | Creator / Collaborator |
| `/trips/share/[shareToken]` | Tokenized public preview page with 1-click collaborator joining and itinerary cloning | Public / Token Holder |
| `/cities` | Global city directory with search, region filters, cost indexes, and bookmarking | Authenticated |
| `/activities` | Experience catalog with category filters, trip stop scheduling, and user contribution forms | Authenticated |
| `/calendar` | Chronological multi-trip calendar view displaying overlapping stays and scheduled itineraries | Authenticated |
| `/community` | Social feed displaying public itineraries for cloning, traveler stories, likes, and comments | Authenticated |
| `/admin` | Administrative dashboard for reviewing and approving community-submitted activities | Admin Only |

---

## Resources & Documentation

- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Tailwind CSS Documentation**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Lucide Icons Catalog**: [https://lucide.dev/icons](https://lucide.dev/icons)
- **Hackathon Context**: Developed for the **Odoo x LDCE Ahmedabad Hackathon 2026 (Virtual Round)**.

---

## License

This project is developed for educational and hackathon submission purposes.
