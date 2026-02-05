const BASE_URL = "https://app.mochi.cards/api";

export class MochiApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errors: unknown,
    message: string
  ) {
    super(message);
    this.name = "MochiApiError";
  }
}

export class MochiClient {
  private readonly authHeader: string;

  constructor(apiKey: string) {
    // Basic auth with API key as username, empty password
    const encoded = Buffer.from(`${apiKey}:`).toString("base64");
    this.authHeader = `Basic ${encoded}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    contentType: string = "application/json"
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      if (contentType === "application/json") {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      } else {
        // For multipart/form-data, don't set Content-Type - fetch will set it with boundary
        options.body = body as FormData;
      }
    }

    const response = await fetch(url, options);

    // Handle rate limiting
    if (response.status === 429) {
      throw new MochiApiError(
        429,
        { errors: ["Rate limited. Please wait before making another request."] },
        "Rate limited by Mochi API"
      );
    }

    // Handle no-content responses (like DELETE)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      // No JSON body
      if (!response.ok) {
        throw new MochiApiError(
          response.status,
          { errors: [response.statusText] },
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
      return undefined as T;
    }

    if (!response.ok) {
      const errorData = data as { errors?: unknown };
      throw new MochiApiError(
        response.status,
        errorData.errors ?? data,
        `HTTP ${response.status}: ${JSON.stringify(errorData.errors ?? data)}`
      );
    }

    return data as T;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  async uploadFile<T>(path: string, file: Blob, filename: string): Promise<T> {
    const formData = new FormData();
    formData.append("file", file, filename);
    return this.request<T>("POST", path, formData, "multipart/form-data");
  }

  // ==========================================================================
  // Cards
  // ==========================================================================

  async listCards(params?: {
    "deck-id"?: string;
    limit?: number;
    bookmark?: string;
  }): Promise<{ bookmark?: string; docs: unknown[] }> {
    const searchParams = new URLSearchParams();
    if (params?.["deck-id"]) searchParams.set("deck-id", params["deck-id"]);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.bookmark) searchParams.set("bookmark", params.bookmark);

    const query = searchParams.toString();
    return this.get(`/cards/${query ? `?${query}` : ""}`);
  }

  async getCard(id: string): Promise<unknown> {
    return this.get(`/cards/${id}`);
  }

  async createCard(data: Record<string, unknown>): Promise<unknown> {
    return this.post("/cards/", data);
  }

  async updateCard(id: string, data: Record<string, unknown>): Promise<unknown> {
    return this.post(`/cards/${id}`, data);
  }

  async deleteCard(id: string): Promise<void> {
    await this.delete(`/cards/${id}`);
  }

  async addAttachment(cardId: string, file: Blob, filename: string): Promise<unknown> {
    return this.uploadFile(`/cards/${cardId}/attachments/${filename}`, file, filename);
  }

  async deleteAttachment(cardId: string, filename: string): Promise<void> {
    await this.delete(`/cards/${cardId}/attachments/${filename}`);
  }

  // ==========================================================================
  // Decks
  // ==========================================================================

  async listDecks(params?: {
    bookmark?: string;
  }): Promise<{ bookmark?: string; docs: unknown[] }> {
    const searchParams = new URLSearchParams();
    if (params?.bookmark) searchParams.set("bookmark", params.bookmark);

    const query = searchParams.toString();
    return this.get(`/decks/${query ? `?${query}` : ""}`);
  }

  async getDeck(id: string): Promise<unknown> {
    return this.get(`/decks/${id}`);
  }

  async createDeck(data: Record<string, unknown>): Promise<unknown> {
    return this.post("/decks/", data);
  }

  async updateDeck(id: string, data: Record<string, unknown>): Promise<unknown> {
    return this.post(`/decks/${id}`, data);
  }

  async deleteDeck(id: string): Promise<void> {
    await this.delete(`/decks/${id}`);
  }

  // ==========================================================================
  // Templates
  // ==========================================================================

  async listTemplates(params?: {
    bookmark?: string;
  }): Promise<{ bookmark?: string; docs: unknown[] }> {
    const searchParams = new URLSearchParams();
    if (params?.bookmark) searchParams.set("bookmark", params.bookmark);

    const query = searchParams.toString();
    return this.get(`/templates/${query ? `?${query}` : ""}`);
  }

  async getTemplate(id: string): Promise<unknown> {
    return this.get(`/templates/${id}`);
  }

  async createTemplate(data: Record<string, unknown>): Promise<unknown> {
    return this.post("/templates/", data);
  }

  // ==========================================================================
  // Due Cards
  // ==========================================================================

  async getDueCards(params?: {
    date?: string;
    "deck-id"?: string;
  }): Promise<{ cards: unknown[] }> {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.set("date", params.date);

    const query = searchParams.toString();
    const basePath = params?.["deck-id"] ? `/due/${params["deck-id"]}` : "/due";
    return this.get(`${basePath}${query ? `?${query}` : ""}`);
  }
}

// Client instance holder for runtime injection
let clientInstance: MochiClient | null = null;

/**
 * Set the global MochiClient instance.
 * This should be called once during server initialization with the API key from environment.
 */
export function setMochiClient(client: MochiClient): void {
  clientInstance = client;
}

/**
 * Get the global MochiClient instance.
 * Throws if setMochiClient hasn't been called.
 */
export function getMochiClient(): MochiClient {
  if (!clientInstance) {
    throw new Error("MochiClient not initialized. Call setMochiClient() first.");
  }
  return clientInstance;
}

/**
 * Create a new MochiClient from an API key.
 * Use this factory function to create clients in different environments.
 */
export function createMochiClient(apiKey: string): MochiClient {
  return new MochiClient(apiKey);
}
