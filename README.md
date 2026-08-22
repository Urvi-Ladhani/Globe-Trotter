GlobeTrotter

Empowering Personalized Travel Planning

GlobeTrotter is a personalized travel-planning web application designed
to make trip planning simple, interactive, and organized. It allows
users to discover destinations, create customized multi-city
itineraries, manage activities and travel dates, estimate expenses, and
visualize their complete journey in one place.

The project is designed around the idea of turning travel planning from
a collection of separate tasks into one connected experience --- Dream
→ Plan → Organize → Explore.

Key Features

Authentication

User registration and login

Secure account-based trip management

User profile and settings

Personalized Home / Landing Page

Search destinations

Top regional selections

Previous trips

Quick access to trip planning

Trip recommendations

Trip Creation

Create a new trip

Add trip name and description

Select start and end dates

Select destinations

Upload an optional cover image

Start from suggested destinations or trip templates

️ Multi-City Itinerary Builder

Add multiple cities/stops

Assign dates to each stop

Add activities to individual days

Reorder destinations

Build a complete day-wise itinerary

Destination & Activity Discovery

Search cities and destinations

Search activities

Filter activities by type, cost, or duration

View activity information before adding it to a trip

Itinerary & Calendar View

Day-wise itinerary

Timeline-style trip visualization

Activity timings

City-wise organization

Calendar view of the complete journey

Easy itinerary editing

Budget & Cost Management

Estimate total trip cost

Track transportation, accommodation, activities, and meals

View daily average cost

Identify expensive days

Visual cost breakdowns

Smart Trip Planning

GlobeTrotter also provides planning-oriented features such as: - Find a
trip based on budget, duration, and travel style - Quick trip planning -
Budget-based destination suggestions - Ready-made trip templates -
Weekend getaway suggestions - Explore destinations by travel style

Sharing & Community

Share itineraries publicly

Public itinerary view

Copy an existing trip

Discover trips created by other users

Community-based travel inspiration

User Profile

Edit personal information

Profile picture

Saved destinations

Language preferences

Manage personal travel plans

Admin / Analytics Dashboard

Monitor platform activity

View user and trip statistics

Track popular cities and activities

Analyze user engagement

Manage platform data

How GlobeTrotter Works

 ┌─────────────────┐
 │ Login / Signup│
 └────────┬────────┘
 ↓
 ┌─────────────────┐
 │ Landing / Home │
 └────────┬────────┘
 ↓
 ┌────────────────────────┐
 │ Discover / Plan a Trip │
 └────────────┬───────────┘
 ↓
 ┌─────────────────┐
 │ Select Cities │
 └────────┬────────┘
 ↓
 ┌─────────────────┐
 │ Add Activities │
 └────────┬────────┘
 ↓
 ┌─────────────────┐
 │ Build Itinerary │
 └────────┬────────┘
 ↓
 ┌────────────────────────┐
 │ Budget & Cost Analysis │
 └────────────┬───────────┘
 ↓
 ┌─────────────────┐
 │ Calendar / View │
 └────────┬────────┘
 ↓
 ┌─────────────────┐
 │ Share Your Trip │
 └─────────────────┘

️ Main Screens

Screen Purpose

Login / Signup Authenticate users
Landing Page Discover destinations and start planning
Create Trip Create the basic trip
My Trips View and manage saved trips
Itinerary Builder Build the complete day-wise itinerary
Itinerary View View the finalized itinerary
City Search Find and add destinations
Activity Search Find and add activities
Budget & Cost Track estimated trip expenses
Calendar / Timeline Visualize the trip schedule
Shared Itinerary Share and discover trips
User Profile Manage account and preferences
Community Explore trips shared by users
Admin Dashboard Analyze platform activity

Sample Trips

The application can be populated with realistic sample itineraries such
as:

Maharashtra Explorer --- Mumbai → Lonavala → Pune

️ Himachal Adventure --- Delhi → Shimla → Manali

️ Goa Chill Trip --- North Goa → South Goa

Rajasthan Royal Route --- Jaipur → Jodhpur → Udaipur

Kerala Nature Escape --- Kochi → Munnar → Thekkady → Alleppey

Europe Highlights --- Paris → Amsterdam → Rome

Japan Discovery --- Tokyo → Kyoto → Osaka

️ Dubai Premium Escape --- Dubai → Abu Dhabi

️ Golden Triangle --- Delhi → Agra → Jaipur

Bali Experience --- Ubud → Kuta → Nusa Penida

Why GlobeTrotter?

Planning a trip often involves switching between destination websites,
activity lists, maps, calendars, notes, and budget calculations.

GlobeTrotter brings these activities together into a single platform
where users can:

Discover → Customize → Organize → Calculate → Visualize → Share

This makes the entire planning process easier while giving users
complete visibility of their journey.

️ Tech Stack

Frontend

React.js

HTML5

CSS / SCSS

JavaScript

Responsive UI

Backend

Node.js

Express.js

REST APIs

Database

Relational database

User data

Trips

Cities

Activities

Itinerary items

Expenses

Development Tools

Git

GitHub

VS Code

npm

Project Structure

GlobeTrotter/
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── features/
│ │ ├── assets/
│ │ └── ...
│ ├── public/
│ └── package.json
│
├── backend/
│ ├── routes/
│ ├── controllers/
│ ├── models/
│ ├── middleware/
│ ├── config/
│ └── package.json
│
├── README.md
└── ...

Folder names may vary depending on the final implementation.

Getting Started

1. Clone the repository

git clone <YOUR_GITHUB_REPOSITORY_URL>
cd GlobeTrotter

2. Install frontend dependencies

cd frontend
npm install

3. Start the frontend

npm run dev

4. Install backend dependencies

Open another terminal:

cd backend
npm install

5. Start the backend

npm run dev

Make sure the required database connection and environment variables are
configured before starting the backend.

Environment Variables

Create a .env file in the backend directory and configure the required
values.

Example:

PORT=3000
DATABASE_URL=your_database_connection
JWT_SECRET=your_secret_key

Do not commit real credentials, API keys, database passwords, or
secret tokens to GitHub.

Project Goals

GlobeTrotter focuses on:

Simplifying multi-city travel planning

Creating personalized itineraries

Helping users stay within budget

Making travel plans easy to visualize

Providing destination and activity discovery

Enabling itinerary sharing

Maintaining structured travel data using a relational database

Providing a responsive and user-friendly experience

Future Enhancements

Possible future improvements include:

Real-time flight and hotel integration

Live weather information

Interactive maps and route optimization

AI-assisted itinerary generation

Real-time travel alerts

Collaborative trip editing

Currency conversion

Offline itinerary access

Personalized recommendations based on previous trips

Team

GlobeTrotter --- Hackathon Project

Built with ️ as a travel-planning solution focused on making
personalized trip planning easier, smarter, and more enjoyable.

License

This project was created for educational and hackathon purposes
