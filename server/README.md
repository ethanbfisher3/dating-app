The purpose of this server is to update daily the places and events used by the date planner app.
It will put this information into a database that is queried by the user of the app.

### Usage

1. Start server: `npm run server`
2. Verify config: `http://localhost:3000/eventbrite/config`
3. Open: `http://localhost:3000/eventbrite/authorize`
4. After successful callback, call: `http://localhost:3000/eventbriteapi`
