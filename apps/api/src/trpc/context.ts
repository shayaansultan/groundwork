export interface TrpcContext {
  requestId: string
}

export function createContext(request: Request): TrpcContext {
  return {
    requestId: request.headers.get('x-request-id') ?? crypto.randomUUID(),
  }
}
