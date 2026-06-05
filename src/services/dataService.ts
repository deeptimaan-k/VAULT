/**
 * Unified Data Service for the Personal Vault.
 * Exclusively routes actions via Node/Express API proxy storing records into secure MongoDB.
 * Requests are authenticated securely on the server using Firebase JWT ID Tokens.
 */

import { auth } from "../lib/firebase";

/**
 * Returns security request authorization headers dynamically with the user's latest ID token.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be signed in to perform this activity.");
  }
  const token = await currentUser.getIdToken(true);
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

/**
 * Add a record to MongoDB.
 */
export async function addRecord(
  sheetName: string,
  recordData: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/mongodb/records", {
      method: "POST",
      headers,
      body: JSON.stringify({ sheetName, ...recordData })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error("MongoDB write error:", err);
    throw new Error(`Write failed: ${err.message}`);
  }
}

/**
 * Update a record in MongoDB.
 */
export async function updateRecord(
  sheetName: string,
  docId: any,
  recordData: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/mongodb/records/${docId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ sheetName, ...recordData })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error("MongoDB update error:", err);
    throw new Error(`Update failed: ${err.message}`);
  }
}

/**
 * Delete a record from MongoDB.
 */
export async function deleteRecord(
  sheetName: string,
  docId: any
): Promise<{ success: boolean; message: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/mongodb/records/${docId}`, {
      method: "DELETE",
      headers
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error("MongoDB deletion error:", err);
    throw new Error(`Deletion failed: ${err.message}`);
  }
}

/**
 * Fetch all records from MongoDB.
 */
export async function fetchAllData(): Promise<{
  isLive: boolean;
  data: Record<string, any[]>;
}> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/mongodb/records", {
      method: "GET",
      headers
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    const res = await response.json();
    return {
      isLive: true,
      data: res.data || {}
    };
  } catch (err: any) {
    console.error("MongoDB batch fetch error:", err);
    throw err;
  }
}

// Minimal Compatibility Stubs to maintain clean imports
export function getActiveScriptUrl(): string {
  return "";
}

export function setActiveScriptUrl(url: string) {
  // Obsolete
}

export function resetSimulatedStorage() {
  // Obsolete
}
