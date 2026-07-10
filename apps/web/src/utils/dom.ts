/**
 * Safely retrieves an element from the DOM by its ID.
 * Throws a descriptive error if the element is not found.
 *
 * @param id - The ID of the element to retrieve.
 * @returns The HTMLElement associated with the ID.
 */
export function getRequiredElementById<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Failed to find the required element with ID: "${id}"`);
    }
    return element as T;
}
