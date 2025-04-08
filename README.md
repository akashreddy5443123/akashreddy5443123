# Campus Connect - Event & Club Management App

This is a web application built with React, TypeScript, Vite, Tailwind CSS, and Supabase to manage campus events, clubs, and announcements, featuring role-based permissions.

## Features

*   **Homepage:** Displays featured events, latest announcements, and quick links to event/club directories. Includes a search bar for events, clubs, and announcements.
*   **Events:** Browse upcoming events, view details on a dedicated page (`/events/:eventId`), and register/unregister.
*   **Clubs:** Browse student clubs, view details, and join/leave clubs.
*   **Announcements:** View campus announcements. Admins can create announcements, and creators/admins can edit/delete them.
*   **Authentication:** User sign-up, sign-in, and password reset using Supabase Auth.
*   **User Profile:** View and edit user profile information (name, DOB, phone, bio).
*   **Event/Club Creation:** Modals for creating new events and clubs.
*   **Permissions:**
    *   **Admin Role:** An `is_admin` flag in the `profiles` table grants administrative privileges.
    *   **Creator/Admin Control:** Only the user who created an event/club/announcement or an admin can update or delete it.
    *   **Admin-Only Creation:** Only admins can create announcements.
*   **Notifications:** A dropdown menu accessible via the bell icon in the header displays the 5 most recent announcements.
*   **Footer:** Displays contact information, social media links, credits, and copyright details.

## Project Structure

```
.
├── public/             # Static assets
├── scripts/
│   └── seed.cjs        # Node.js script to seed database (requires Service Role Key)
├── src/
│   ├── components/     # Reusable React components (Header, Footer, Modals, Cards, Dropdowns, etc.)
│   ├── lib/
│   │   └── supabase.ts # Supabase client initialization
│   ├── pages/          # Page-level components (Events, Clubs, Dashboard, EventDetail, etc.)
│   ├── stores/
│   │   └── authStore.ts# Zustand store for authentication state management
│   ├── App.tsx         # Main application component with routing
│   ├── index.css       # Global styles and Tailwind directives
│   └── main.tsx        # Application entry point
├── supabase/           # Supabase local development files
│   └── migrations/     # Database migration SQL files
├── .env                # Environment variables (Supabase URL & Anon Key)
├── index.html          # Main HTML entry point
├── package.json        # Project dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # Base TypeScript configuration
├── tsconfig.app.json   # TypeScript configuration for the app
├── tsconfig.node.json  # TypeScript configuration for Node.js scripts
└── vite.config.ts      # Vite build tool configuration
```

## Key Files & Functionality

*   **`src/App.tsx`**: Sets up the main layout, routing (using `react-router-dom`), including the event detail route (`/events/:eventId`). Fetches/displays announcements on the homepage.
*   **`src/main.tsx`**: Renders the root React component (`App`) into the DOM. Imports global CSS.
*   **`src/index.css`**: Includes Tailwind CSS base, components, and utilities. Defines global `body` styles for the theme.
*   **`src/lib/supabase.ts`**: Initializes the Supabase client using credentials from `.env`.
*   **`src/stores/authStore.ts`**: Manages user authentication state (user object including `is_admin`, loading status) and provides functions (`signIn`, `signUp`, `signOut`, `resetPassword`, `initializeAuth`) using Zustand.
*   **`src/components/Header.tsx`**: Displays the site title and navigation. Conditionally shows Sign In/Sign Up buttons or the `ProfileDropdown`. Includes the notification bell dropdown fetching recent announcements.
*   **`src/components/Footer.tsx`**: Displays contact information, social media links, credits, and copyright details at the bottom of the application.
*   **`src/components/AuthModal.tsx`**: Handles user Sign In, Sign Up, and Password Reset flows. Interacts with `authStore`.
*   **`src/pages/Events.tsx`**: Fetches events, displays them, handles registration/unregistration, and includes the "Create Event" button. Shows delete button based on creator/admin status.
*   **`src/pages/EventDetailPage.tsx`**: Fetches and displays details for a single event based on the URL parameter. Handles registration/unregistration for the specific event.
*   **`src/pages/Clubs.tsx`**: Fetches and displays clubs, handles joining/leaving. Shows delete button based on creator/admin status.
*   **`src/pages/Announcements.tsx`**: Fetches and displays announcements. Shows "Create Announcement" button for admins. Shows Edit/Delete buttons based on creator/admin status.
*   **`src/components/CreateAnnouncementModal.tsx`**: Modal component used by admins to create new announcements.
*   **`src/pages/UserDashboard.tsx`**: (Assumed functionality) Displays user-specific information.
*   **`src/components/EditProfileModal.tsx`**: (Assumed functionality) Allows users to update their profile information stored in the Supabase `profiles` table.
*   **`supabase/migrations/`**: Contains SQL files defining the database schema changes, including adding `is_admin` to `profiles` and `created_by` to relevant tables.
*   **`scripts/seed.cjs`**: A script to populate the hosted Supabase database with sample clubs and events using the Service Role Key. Run with `node scripts/seed.cjs`.

## Getting Started

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Supabase:**
    *   Create a project on [Supabase](https://supabase.com/).
    *   In your Supabase project dashboard, go to **SQL Editor** and run the SQL commands from the files in the `supabase/migrations/` directory in chronological order to set up your database schema. **Ensure all migrations, including those adding `is_admin` and updating RLS policies, are applied.**
    *   **Important:** You may need to manually set the `is_admin` flag to `true` for your user account in the `profiles` table via the Supabase table editor or an SQL command (`UPDATE public.profiles SET is_admin = true WHERE id = 'your-user-id';`) to test admin features.
    *   Go to **Project Settings > API**.
    *   Copy the **Project URL** and the **public anon key**.
    *   Create a `.env` file in the project root and add your credentials:
        ```
        VITE_SUPABASE_URL=YOUR_PROJECT_URL
        VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
        ```
4.  **(Optional) Seed Database:**
    *   Get your **Service Role Key** from **Project Settings > API**.
    *   **Temporarily** replace the placeholder key in `scripts/seed.cjs` with your Service Role Key.
    *   Run the script: `node scripts/seed.cjs`
    *   **Important:** Remove your Service Role Key from the script file after running it.
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should be available at `http://localhost:5173` (or the next available port).

## Notes

*   The application uses Tailwind CSS for styling.
*   State management is handled by Zustand (`src/stores/authStore.ts`).
*   Routing is handled by React Router (`src/App.tsx`).
*   **Row Level Security (RLS)** is enabled on Supabase tables to enforce permissions. Ensure policies are correctly configured as per the migration files.
*   Deleting clubs requires `ON DELETE CASCADE` on the foreign key in the `events` table (handled in migrations).
