# Vinmoore Contact Backend

Express API for sending Vinmoore website contact messages through Yahoo SMTP.

## Environment Variables

Create a `.env` file locally, or add these variables in your hosting provider:

```env
YAHOO_USER=your-yahoo-address@yahoo.com
YAHOO_APP_PASSWORD=your-yahoo-app-password
CONTACT_TO_EMAIL=your-yahoo-address@yahoo.com
ALLOWED_ORIGINS=http://localhost:3000,https://your-static-website.com
```

Use a Yahoo app password, not your normal Yahoo password.

## Run Locally

```bash
npm install
npm start
```

The API runs on `http://localhost:3002`.

## Endpoints

- `GET /health`
- `POST /send-email`

Request body:

```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "message": "Message text"
}
```
