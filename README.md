# Menteere Backend
## Design
* `src/app/controllers`: interact with S3 data to perform CRUD operations for requests
* `src/app/helpers`: helper utility functions for basic tasks
* `src/app/middleware`: error handlers and request handlers middleware
* `src/app/models`: database schemas
* `src/database/migrations`: knex migrations for schemas
* `src/logs`: used for logging, unused at the moment
* `src/routes`: routers for request to correct controller and function
* `src/app.js`: set up backend app
* `server.js`: create backend server for local/prod use

## How it all fits together
A request from the frontend comes to the router, in `src/routes`, and sends the request data to the appropriate controller in `src/app/controllers`. The request goes through some basic middleware and helper functions, found in `src/app/helpers` and `src/app/middleware`, before getting to the controller. The controller references the schemas found in `src/database/migrations`. The server is created with `server.js` and `src/app.js` defines the routers the requests use. 