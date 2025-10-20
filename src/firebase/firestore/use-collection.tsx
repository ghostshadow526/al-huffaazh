
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  collection,
  getDocs,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data in the collection.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Array of document data with IDs, or null.
  isLoading: boolean; // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {Query<DocumentData> | null | undefined} memoizedTargetRefOrQuery -
 * The Firestore Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  type StateDataType = WithId<T>[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If the query is not ready, reset the state.
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        // Map snapshot documents to the desired data type with ID.
        const result: WithId<T>[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(result);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        // In case of an error, create a contextual error message and emit it globally.
        const path = (memoizedTargetRefOrQuery as any)._query
          ? (memoizedTargetRefOrQuery as any)._query.path.canonicalString()
          : (memoizedTargetRefOrQuery as any).path;

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // Unsubscribe from the snapshot listener when the component unmounts
    // or when the query reference changes.
    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]); // Re-run effect if memoized query changes.

  return { data, isLoading, error };
}
