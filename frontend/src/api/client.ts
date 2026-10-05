import type { AnalyticsSummary, Contact, ContactInput, ContactPage, ContactResponse } from './types';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.');
  }

  if (!response.ok) {
    let message = response.status === 404
      ? 'O contato não foi encontrado ou já foi excluído.'
      : 'Não foi possível concluir a operação. Tente novamente.';
    try {
      const body: unknown = await response.json();
      if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
        message = body.error;
      }
    } catch {
      // Um proxy ou erro inesperado pode responder sem JSON.
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function jsonBody(method: 'POST' | 'PUT', input: ContactInput): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) };
}

export const api = {
  contacts(search: string, page: number, pageSize = 20, signal?: AbortSignal) {
    const query = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) });
    return request<ContactPage>(`/contacts?${query}`, { signal });
  },
  contact(id: number, signal?: AbortSignal) {
    return request<Contact>(`/contacts/${id}`, { signal });
  },
  createContact(input: ContactInput) {
    return request<Contact>('/contacts', jsonBody('POST', input));
  },
  updateContact(id: number, input: ContactInput) {
    return request<Contact>(`/contacts/${id}`, jsonBody('PUT', input));
  },
  deleteContact(id: number) {
    return request<void>(`/contacts/${id}`, { method: 'DELETE' });
  },
  responses(id: number, signal?: AbortSignal) {
    return request<ContactResponse[]>(`/contacts/${id}/responses`, { signal });
  },
  summary(signal?: AbortSignal) {
    return request<AnalyticsSummary>('/analytics/summary', { signal });
  },
};
