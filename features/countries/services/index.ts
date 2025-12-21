import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  getCountFromServer,
  QueryDocumentSnapshot,
  where,
  QueryConstraint,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { ONE_DAY } from "@/lib/constants";
import { generateSearchTerms } from "@/lib/utils";
import {
  CountryType,
  GetCountriesParamsType,
  CountriesAPIResponse,
} from "@/features/countries/types";

const COUNTRIES_COLLECTION = collection(db, "countries");
const WORLD_DOCUMENT_ID = "WORLD";

export async function fetchCountriesFromAPI(): Promise<CountryType[]> {
  const response = await fetch("https://v3.football.api-sports.io/countries", {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY!,
    },
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const json = await response.json();
  return json.response as CountryType[];
}

let totalCountCache: number | null = null;

export async function getCountries({
  pageSize,
  cursor,
  nameQuery,
  codeQuery,
  searchQuery,
}: GetCountriesParamsType): Promise<CountriesAPIResponse> {
  const now = Date.now();

  const snapshotCheck = await getDocs(query(COUNTRIES_COLLECTION, limit(1)));
  let shouldFetchAPI = false;

  if (snapshotCheck.empty) {
    shouldFetchAPI = true;
  } else {
    const firstDoc = snapshotCheck.docs[0].data() as CountryType & {
      updatedAt?: number;
    };
    shouldFetchAPI = !firstDoc.updatedAt || now - firstDoc.updatedAt > ONE_DAY;
  }

  if (shouldFetchAPI) {
    const fetchedCountries = await fetchCountriesFromAPI();
    const batch = writeBatch(db);

    for (const country of fetchedCountries) {
      const documentId = country.code ?? WORLD_DOCUMENT_ID;
      batch.set(doc(COUNTRIES_COLLECTION, documentId), {
        ...country,
        nameLower: country.name.toLowerCase(),
        ...(country.code ? { codeLower: country.code.toLowerCase() } : {}),
        updatedAt: now,
        searchTerms: generateSearchTerms(country.name),
      });
    }

    await batch.commit();
  }

  if (totalCountCache === null) {
    const totalSnapshot = await getCountFromServer(COUNTRIES_COLLECTION);
    totalCountCache = totalSnapshot.data().count;
  }

  let q;
  let cursorDoc: QueryDocumentSnapshot | null = null;

  if (nameQuery) {
    q = query(
      COUNTRIES_COLLECTION,
      where("nameLower", "==", nameQuery.toLowerCase())
    );
  } else if (codeQuery) {
    q = query(
      COUNTRIES_COLLECTION,
      where("codeLower", "==", codeQuery.toLowerCase())
    );
  } else {
    const constraints: QueryConstraint[] = [];

    if (searchQuery) {
      // Requires an index
      constraints.push(
        where("searchTerms", "array-contains", searchQuery.toLowerCase())
      );
    }

    constraints.push(orderBy("name"));

    if (cursor) {
      const cursorSnapshot = await getDocs(
        query(
          COUNTRIES_COLLECTION,
          ...(searchQuery
            ? [
                where(
                  "searchTerms",
                  "array-contains",
                  searchQuery.toLowerCase()
                ),
              ]
            : []),
          orderBy("name"),
          where("name", "==", cursor),
          limit(1)
        )
      );

      if (!cursorSnapshot.empty) {
        cursorDoc = cursorSnapshot.docs[0];
        constraints.push(startAfter(cursorDoc));
      }
    }

    constraints.push(limit(pageSize + 1));

    q = query(COUNTRIES_COLLECTION, ...constraints);
  }

  const snapshot = await getDocs(q);

  const hasNextPage = snapshot.docs.length > pageSize;

  const countries = snapshot.docs
    .slice(0, pageSize)
    .map((doc) => doc.data() as CountryType);

  const lastDoc =
    snapshot.docs[Math.min(pageSize - 1, snapshot.docs.length - 1)];
  const nextCursor =
    lastDoc && !nameQuery && !codeQuery && hasNextPage
      ? lastDoc.get("name")
      : null;

  let total = totalCountCache;
  if (nameQuery || codeQuery || searchQuery) {
    const countConstraints: QueryConstraint[] = [];

    if (nameQuery) {
      countConstraints.push(where("nameLower", "==", nameQuery.toLowerCase()));
    } else if (codeQuery) {
      countConstraints.push(where("codeLower", "==", codeQuery.toLowerCase()));
    } else if (searchQuery) {
      countConstraints.push(
        where("searchTerms", "array-contains", searchQuery.toLowerCase())
      );
    }

    const countQuery = query(COUNTRIES_COLLECTION, ...countConstraints);
    const countSnapshot = await getCountFromServer(countQuery);
    total = countSnapshot.data().count;
  }

  return {
    total,
    countries,
    nextCursor,
    hasNextPage,
  };
}
