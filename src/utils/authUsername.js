// authUsername.js
//
// Firebase Authentication requires an email-formatted identifier — it has no
// native concept of a bare username. Since this app authenticates users with
// a Username instead of a real email address (not every employee has one),
// we derive an internal "synthetic" email from the username
// (e.g. "john_doe" -> "john_doe@hearingcare.local") and use THAT with
// Firebase Auth under the hood.
//
// This keeps Firebase's secure password hashing, session handling, and
// built-in "already in use" uniqueness check working exactly as before —
// the user only ever sees or types their Username; the synthetic email is
// an implementation detail.

export const USERNAME_DOMAIN = '@hearingcare.local';
export const MIN_USERNAME_LENGTH = 6; // spec: "more than 5 characters"

// Letters, numbers, underscore, and dot only — keeps the synthetic email
// valid and avoids characters that could cause issues in Firebase Auth
// or as a Firestore field value.
const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

export function normalizeUsername(rawUsername) {
  return (rawUsername || '').trim().toLowerCase();
}

/**
 * Returns an error message string if invalid, or null if the username is valid.
 */
export function validateUsername(rawUsername) {
  const username = normalizeUsername(rawUsername);

  if (username.length < MIN_USERNAME_LENGTH) {
    return `Username must be more than ${MIN_USERNAME_LENGTH - 1} characters.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username can only contain letters, numbers, underscores, and dots (no spaces).';
  }
  return null;
}

export function usernameToAuthEmail(rawUsername) {
  return `${normalizeUsername(rawUsername)}${USERNAME_DOMAIN}`;
}

export function authEmailToUsername(authEmail) {
  return (authEmail || '').replace(USERNAME_DOMAIN, '');
}