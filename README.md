# Events Management Service

A simple DFINITY Canister smart contract for managing events.

## Features

- **Create Events:** Easily create new Events with essential details.
- **Update Events:** Owners can update Event information.
- **End Events:** Owners can end Events, marking them as inactive.
- **Retrieve Events:** Fetch Events based on various criteria, such as ID, status, and owner.
- **Validation:** Ensure valid Event status before retrieval or creation.

## Usage


### Query Functions

1. **Get All Events:**
   - `/getAllEvents`: Retrieve a list of all Events.

2. **Get Event by ID:**
   - `/getEventById/{eventId}`: Retrieve details of a specific Event by ID.

3. **Get Owner's Events:**
   - `/getOwnersEvents`: Retrieve Events owned by the caller.

4. **Get Events by Status:**
   - `/getEventsByStatus/{status}`: Retrieve Events with a specific status.

5. **Get Active Events:**
   - `/getActiveEvents`: Retrieve Events with an active status.

6. **Get Expired Events:**
   - `/getExpiredEvents`: Retrieve Events with an inactive status.

### Update Functions

7. **Create Event:**
   - `/createEvent`: Create a new Event with provided details.

8. **Update Event:**
   - `/updateEvent/{eventId}`: Update details of an existing Event.

9. **End Event:**
   - `/endEvent/{eventId}`: End an Event, marking it as inactive.

10. **Delete Event:**
    - `/deleteEvent/{eventId}`: Delete an Event (owner only).

### Helper Function

11. **Is Event Status Valid:**
    - **Function:** `isEventStatusValid(status: string)`
    - **Returns:** Boolean indicating whether the provided Event status is valid.
