// src/utils/generateEmployeeId.js
import { doc, runTransaction } from 'firebase/firestore';

/**
 * Atomically generates the next sequential Employee ID in the format
 * EM0001, EM0002, ... EM9999, backed by a single counter document at
 * Counters/employeeId in Firestore.
 *
 * Using a transaction guarantees that if two people sign up at the exact
 * same moment, they still get two different, sequential numbers — one
 * write always retries rather than both reading the same "current" value.
 *
 * @param {Firestore} db - the Firestore instance (from getFirestore(app))
 * @returns {Promise<string>} e.g. "EM0001"
 */
export const generateEmployeeId = async (db) => {
  const counterRef = doc(db, 'Counters', 'employeeId');

  const nextNumber = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const current = counterSnap.exists() ? counterSnap.data().current : 0;
    const next = current + 1;

    if (next > 9999) {
      // Format only supports EM0001–EM9999. Extend the padding (e.g. 5
      // digits) here if you ever expect to exceed 9999 sign-ups.
      throw new Error('Employee ID limit (EM9999) reached.');
    }

    transaction.set(counterRef, { current: next }, { merge: true });
    return next;
  });

  return `EM${String(nextNumber).padStart(4, '0')}`;
};