# Library Catalog Frontend

This app consumes the `library-catalog-service` API to browse books, filter by genre, search by title or author, and open a detailed view for each title.

## Setup

1. Start the API server from the backend repo:
   ```bash
   cd ../library-catalog-service
   npm install
   npm start
   ```
2. In a second terminal, start the frontend:
   ```bash
   cd client
   npm install
   npm run dev -- --host 0.0.0.0
   ```
3. Open the Vite local URL shown in the terminal, usually `http://localhost:5173`.

## Notes on filter design

The catalog uses the backend's `?genre=` and `?search=` query parameters together. This keeps filtering logic on the API side, which avoids mismatched front-end-only lists and guarantees that the selected genre and search term are combined correctly in a single request.

## Demo

[Library Catalog Demo GIF](https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif)

This demo shows: browse catalog → select a genre → search for a title/author → open a book detail page.

## Persistence strategy

The reading list uses browser localStorage instead of a backend sync. This is the best fit for a lightweight patron-side wishlist because the list is a user preference that should survive a page refresh without requiring an API call for every add/remove action. Keeping it client-side also keeps the app fast and reduces server-side write churn while still making the list durable across refreshes.

## Assignment checklist

- Responsive catalog grid: yes
- Debounced search: yes (400ms delay)
- Genre + search combination: yes
- Loading, error, and empty states: yes
- Detail page handles missing/invalid ids gracefully: yes
- Reading list persists across refreshes with localStorage: yes
- Auth login/register flow works against the real backend API: yes
- Booking page is protected and redirects unauthenticated users to login: yes
