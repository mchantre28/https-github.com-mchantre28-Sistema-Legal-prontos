/**
 * Modelo de Cliente — Firestore-ready
 * Morada completa para faturas
 */

export type ClientType = 'empresa' | 'particular';

/** Morada completa do cliente */
export interface ClientAddress {
  rua: string;
  numero?: string;
  andar?: string;
  codigoPostal: string;
  localidade: string;
  pais: string;
}

export interface Client {
  id: string;
  nome: string;
  nif: string;
  /** Determina se retenção na fonte é aplicável (apenas empresas) */
  tipo: ClientType;
  morada: ClientAddress;
  /** Opcional: representante legal (empresas) */
  representanteLegal?: string;
  telefone?: string;
  email?: string;
}
