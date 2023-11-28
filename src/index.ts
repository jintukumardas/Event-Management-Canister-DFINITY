import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Event = Record<{
    id: string;
    assetType: string;
    assetDescription: string;
    ownerName: string;
    ownerId: string;
    startDate: nat64;
    endDate: nat64;
    status: string;
}>;

type EventPayload = Record<{
    assetType: string;
    assetDescription: string;
    ownerName: string;
    status: string;
}>;

const fixedEndDate = 86400000;

const eventStorage = new StableBTreeMap<string, Event>(1, 44, 1024);

/**
 * Retrieves all events from the system.
 * @returns A Result containing a list of events or an error message.
 */
$query;
export function getAllEvents(): Result<Vec<Event>, string> {
    try {
        return Result.Ok(eventStorage.values());
    } catch (error) {
        return Result.Err('Failed to get events');
    }
}

/**
 * Retrieves a specific event by ID.
 * @param eventId - The ID of the event to retrieve.
 * @returns A Result containing the event or an error message.
 */
$query;
export function getEventById(eventId: string): Result<Event, string> {
    // Validate ID
    if (!isValidUUID(eventId)) {
        return Result.Err<Event, string>('Invalid event ID');
    }

    return match(eventStorage.get(eventId), {
        Some: (event) => Result.Ok<Event, string>(event),
        None: () => Result.Err<Event, string>(`Event with the provided id: ${eventId} has not been found!`),
    });
}

/**
 * Retrieves all events owned by a specific owner.
 * @param ownerId - The ID of the owner.
 * @returns A Result containing a list of events or an error message.
 */
$query;
export function getOwnersEvents(ownerId: string): Result<Vec<Event>, string> {
    // Validate ID
    if (!isValidUUID(ownerId)) {
        return Result.Err<Vec<Event>, string>('Invalid owner ID');
    }

    try {
        return Result.Ok(eventStorage.values().filter((event) => event.ownerId === ownerId));
    } catch (error) {
        return Result.Err(`Failed to retrieve events for owner with ID ${ownerId}!`);
    }
}

/**
 * Retrieves events based on their status.
 * @param status - The status to filter events.
 * @returns A Result containing a list of events or an error message.
 */
$query;
export function getEventsByStatus(status: string): Result<Vec<Event>, string> {
    try {
        // Validate status
        if (!isEventStatusValid(status)) {
            return Result.Err(`Invalid event status: ${status}`);
        }

        const events: Vec<Event> = eventStorage.values().filter((event) => {
            return event.status == status;
        });

        return Result.Ok(events);
    } catch (error) {
        return Result.Err('Failed to retrieve events!');
    }
}

/**
 * Creates a new event.
 * @param payload - Information about the event.
 * @returns A Result containing the new event or an error message.
 */
$update;
export function createEvent(payload: EventPayload): Result<Event, string> {
    try {
        // Validate payload
        if (!payload.assetType || !payload.assetDescription || !payload.ownerName || !payload.status) {
            return Result.Err<Event, string>('Incomplete input data!');
        }

        // Generate a unique ID for the event
        const eventId = uuidv4();
        // Set each property for better performance
        const newEvent: Event = {
            id: eventId,
            assetType: payload.assetType,
            assetDescription: payload.assetDescription,
            ownerName: payload.ownerName,
            ownerId: uuidv4(), // Generate a unique owner ID
            startDate: ic.time(),
            endDate: ic.time() + BigInt(fixedEndDate),
            status: payload.status,
        };

        // Add the event to eventStorage
        eventStorage.insert(newEvent.id, newEvent);

        return Result.Ok(newEvent);
    } catch (error) {
        return Result.Err<Event, string>('Failed to create event!');
    }
}

/**
 * Updates information for a specific event.
 * @param eventId - The ID of the event to update.
 * @param ownerId - The ID of the owner making the update.
 * @param payload - Updated information about the event.
 * @returns A Result containing the updated event or an error message.
 */
$update;
export function updateEvent(eventId: string, ownerId: string, payload: EventPayload): Result<Event, string> {
    // Validate IDs
    if (!isValidUUID(eventId) || !isValidUUID(ownerId)) {
        return Result.Err<Event, string>('Invalid event or owner ID for updating an event.');
    }

    return match(eventStorage.get(eventId), {
        Some: (event) => {
            // Validate ownership
            if (event.ownerId !== ownerId) {
                return Result.Err<Event, string>('Only the owner can update this event!');
            }

            // Set each property for better performance
            const updatedEvent: Event = {
                id: event.id,
                assetType: payload.assetType || event.assetType,
                assetDescription: payload.assetDescription || event.assetDescription,
                ownerName: payload.ownerName || event.ownerName,
                ownerId: event.ownerId,
                startDate: event.startDate,
                endDate: event.endDate,
                status: payload.status || event.status,
            };

            // Update the event in eventStorage
            eventStorage.insert(event.id, updatedEvent);

            return Result.Ok<Event, string>(updatedEvent);
        },
        None: () => Result.Err<Event, string>(`Failed to update event with id: ${eventId}!`),
    });
}

/**
 * Ends a specific event.
 * @param eventId - The ID of the event to end.
 * @param ownerId - The ID of the owner ending the event.
 * @returns A Result containing the ended event or an error message.
 */
$update;
export function endEvent(eventId: string, ownerId: string): Result<Event, string> {
    // Validate IDs
    if (!isValidUUID(eventId) || !isValidUUID(ownerId)) {
        return Result.Err<Event, string>('Invalid event or owner ID for ending an event.');
    }

    return match(eventStorage.get(eventId), {
        Some: (event) => {
            // Validate ownership
            if (event.ownerId !== ownerId) {
                return Result.Err<Event, string>('Only the owner can end this event!');
            }

            // Validate if the event has already ended
            if (event.endDate >= ic.time()) {
                return Result.Err<Event, string>('Event already ended!');
            }

            // Set each property for better performance
            const endedEvent: Event = {
                id: event.id,
                assetType: event.assetType,
                assetDescription: event.assetDescription,
                ownerName: event.ownerName,
                ownerId: event.ownerId,
                startDate: event.startDate,
                endDate: ic.time(),
                status: 'inactive',
            };

            // Update the event in eventStorage
            eventStorage.insert(event.id, endedEvent);

            return Result.Ok<Event, string>(endedEvent);
        },
        None: () => Result.Err<Event, string>(`Failed to end event with id: ${eventId}!`),
    });
}

/**
 * Deletes a specific event.
 * @param eventId - The ID of the event to delete.
 * @param ownerId - The ID of the owner deleting the event.
 * @returns A Result containing the deleted event or an error message.
 */
$update;
export function deleteEvent(eventId: string, ownerId: string): Result<Event, string> {
    // Validate IDs
    if (!isValidUUID(eventId) || !isValidUUID(ownerId)) {
        return Result.Err<Event, string>('Invalid event or owner ID for deleting an event.');
    }

    return match(eventStorage.remove(eventId), {
        Some: (event) => {
            // Validate ownership
            if (event.ownerId !== ownerId) {
                return Result.Err<Event, string>('Only owner can delete event!');
            }

            return Result.Ok<Event, string>(event);
        },
        None: () => Result.Err<Event, string>(`Failed to delete event with id: ${eventId}`),
    });
}

/**
 * Checks if an event status is valid.
 * @param status - The event status to validate.
 * @returns True if the status is valid, otherwise false.
 */
function isEventStatusValid(status: string): boolean {
    return status === 'active' || status === 'inactive';
}

// A workaround to make the uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },
};

/**
 * Validates whether a given string is a valid UUID.
 * @param id - The string to validate as a UUID.
 * @returns True if the string is a valid UUID, otherwise false.
 */
export function isValidUUID(id: string): boolean {
    // Validate if the provided ID is a valid UUID
    return /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/i.test(id);
}
