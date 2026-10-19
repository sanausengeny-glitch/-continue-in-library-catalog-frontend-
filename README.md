<<<<<<< HEAD
# library-catalog-service-Week-3-Assignment
=======
# Library Catalog Service

This project exposes a MongoDB-backed Express API for a small library catalog. It supports both a `Genre` lookup table and a `Book` catalog with filtering, search, and pagination.

## Setup

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB connection string.
3. Seed the database:
   `npm run seed`
4. Start the API:
   `npm start`

## Data Model

- `Genre`: `{ name, slug }`
- `Book`: `{ title, author, isbn, description, coverImage, totalCopies, availableCopies, genre }`

## API Endpoints

### Genres

- `GET /genres` — list all genres
- `GET /genres/:id` — fetch one genre by id
- `POST /genres` — create a genre
- `PUT /genres/:id` — update a genre
- `DELETE /genres/:id` — delete a genre

Example request body:

```json
{
  "name": "Science Fiction",
  "slug": "science-fiction"
}
```

If `slug` is omitted, it is generated automatically from the genre name.

### Books

- `GET /books` — list books with optional filters
- `GET /books/:id` — fetch one book by id
- `POST /books` — create a book
- `PUT /books/:id` — update a book
- `DELETE /books/:id` — delete a book

#### `GET /books` query parameters

- `genre=<genreId>` — filter by a single genre id
- `search=<text>` — case-insensitive match against `title` or `author`
- `page=<number>` — page number, default `1`
- `limit=<number>` — number of records per page, default `10`

Example:

`GET /books?genre=64d4f3b9d1a61c8d8f123456&search=dune&page=2&limit=5`

Response shape:

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Dune",
      "author": "Frank Herbert",
      "genre": {
        "_id": "...",
        "name": "Science Fiction",
        "slug": "science-fiction"
      }
    }
  ],
  "pagination": {
    "page": 2,
    "limit": 5,
    "total": 18,
    "totalPages": 4
  }
}
```

### Validation

The API validates create and update payloads before writing to the database.

- Missing required fields return `400`
- Wrong field types return `400`
- Invalid `genre` ids return `400`
- A `Book` with `availableCopies > totalCopies` returns `400`

Example validation error response:

```json
{
  "success": false,
  "error": {
    "field": "title",
    "message": "title is required."
  }
}
```

### Delete behavior

When a `Genre` is deleted, the service first checks whether any `Book` records still reference it. If so, the request is rejected with `400` instead of leaving orphaned book records. This keeps referential integrity intact in the catalog.

## Authentication and Token Storage

The service stores the JWT in an httpOnly cookie named `token`. This is the preferred choice for this API because it helps guard against XSS-based token theft: client-side JavaScript cannot read the cookie, so a malicious script running on the page cannot easily grab the signed session. The trade-off is that cookies are more exposed to CSRF risks, so the API uses the default sameSite policy (`lax`) and should be paired with explicit CSRF protections for any browser-based form flow that crosses origins.

By contrast, localStorage is simpler for browser apps but much easier to read from JavaScript, which makes it more vulnerable to XSS attacks. A server-side session store can offer stronger server-side invalidation, but it adds more infrastructure and complexity than a stateless JWT cookie. For this project, a short-lived httpOnly cookie is a reasonable balance of security and simplicity.

### Seeded librarian account

- Username: `librarian1`
- Email: `librarian@library.test`
- Password: `LibrarianPass123!`

This account is the only librarian seeded for testing protected book routes.

## Notes

- All error responses are JSON and do not expose stack traces.
- Book and genre routes are protected by reusable validation middleware in `middleware/validate.js`.
- The project includes a Postman collection in `postman/library-catalog.postman_collection.json` covering all endpoints.
>>>>>>> 3cf4a1f (Add auth, role-based protection, and seeded librarian)
