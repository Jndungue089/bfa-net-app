import { ApiError } from "@bfa/shared";

export const errorMessage = (e: unknown): string => (e instanceof ApiError ? e.message : "Ocorreu um erro inesperado. Tente novamente.");
