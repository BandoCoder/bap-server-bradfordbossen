# BAP API

## AUTHENTICATE USER

METHOD: POST | ENDPOINT: /api/auth/login | RETURNS: JWT

### Request Body

TYPE: JSON | FIELDS: user_name, password | DESCRIPTION: JSON containing a username and password

### Response

200: Recieve JWT with authed user_name and id in payload
400: Missing field (username or password)
400: Wrong username or password (or both)

## User Registration

METHOD: POST | ENDPOINT: /api/users | DESCRIPTION: Register new user | RETURNS: User Object
