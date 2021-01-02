# BAP API

## Auth

| Method | Endpoint        | Usage               | Returns |
| ------ | --------------- | ------------------- | ------- |
| POST   | /api/auth/login | Authenticate a user | JWT     |

#### POST

Endpoint for authenticating a user

##### Request Body

| Type | Fields              | Description                                    |
| ---- | ------------------- | ---------------------------------------------- |
| JSON | user_name, password | JSON containing a username and password string |

##### Responses

| Code | Description                                                    |
| ---- | -------------------------------------------------------------- |
| 200  | Receive JWT with authenticated user_name and id inside payload |
| 400  | Missing '{user_name OR password}' in request body              |
| 400  | Incorrect user_name or password                                |

## User Registration

| Method | Endpoint   | Usage    | Returns     |
| ------ | ---------- | -------- | ----------- |
| POST   | /api/users | Register | User Object |

#### POST

Endpoint for registering new users

##### Request Body

| Type | Fields                     | Description                                       |
| ---- | -------------------------- | ------------------------------------------------- |
| JSON | user_name, email, password | JSON containing username, email, password strings |

##### Responses

| Code | Description                                                  |
| ---- | ------------------------------------------------------------ |
| 201  | Respond with object containing user data                     |
| 400  | Missing '{user_name OR email OR password}' in request body   |
| 400  | Error response object containing a validation error messages |

## Patterns

| Method | Endpoint                    | Usage                       | Returns           |
| ------ | --------------------------- | --------------------------- | ----------------- |
| POST   | /api/patterns               | Create new pattern          | Pattern Object    |
| GET    | /api/patterns/{patternid}   | Get a pattern               | Pattern Object    |
| DELETE | /api/patterns/{patternid}   | Delete a pattern            | Empty Response    |
| PATCH  | /api/patterns/{patternid}   | Edit a pattern              | Empty Response    |
| GET    | /api/patterns/user/{userid} | Get all patterns for a user | Array of Patterns |

**Authorization required for all endpoints**

#### POST

Create new pattern

##### Request Body

| Type | Fields              | Description                                                                                                                                                                                     |
| ---- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON | title, pattern_data | pattern_data should be an object containing fields for 'bpm' and 'notes', an array of notes where notes are represented as a pair of time and key strings inside an array (ex. ['1:0:0', 'C4']) |

##### Responses

| Code | Description                                                          |
| ---- | -------------------------------------------------------------------- |
| 201  | Respond with pattern object and append pattern id to location header |
| 400  | Missing '{title OR pattern_data}' in request body                    |
| 401  | Unauthorized Request                                                 |

### `/api/patterns/:patternid`

##### Path parameters

| Path parameter | Value             |
| -------------- | ----------------- |
| patternid      | Unique pattern id |

#### GET

Returns an object containing all pattern data

##### Responses

| Code | Description                 |
| ---- | --------------------------- |
| 200  | Respond with pattern object |
| 404  | Pattern doesn't exist       |
| 401  | Unauthorized Request        |

#### DELETE

Delete an existing pattern

##### Responses

| Code | Description           |
| ---- | --------------------- |
| 204  | No response           |
| 404  | pattern doesn't exist |
| 401  | Unauthorized Request  |

#### PATCH

Edit an existing pattern

##### Request Body

| Type | Fields                | Description                                                                                                                                                                                     |
| ---- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON | title OR pattern_data | pattern_data should be an object containing fields for 'bpm' and 'notes', an array of notes where notes are represented as a pair of time and key strings inside an array (ex. ['1:0:0', 'C4']) |

##### Responses

| Code | Description           |
| ---- | --------------------- |
| 204  | No response           |
| 404  | Pattern doesn't exist |
| 401  | Unauthorized Request  |

### `/api/patterns/user/:userid`

#### GET

Returns an array of objects containing all of the
patterns beloning to user with id of `:userid`

##### Path parameters

| Path parameter | Value          |
| -------------- | -------------- |
| userid         | Unique user id |

##### Responses

| Code | Description                   |
| ---- | ----------------------------- |
| 200  | Respond with array of objects |
| 401  | Unauthorized Request          |
