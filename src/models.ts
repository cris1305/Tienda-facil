export type UserRole = 'admin' | 'vendedor';
export type ProductUnit = 'unidad' | 'libra' | 'litro';

export interface Tienda {
  id: number;
  name: string;
  ownerId: number; // Corresponds to a User with 'admin' role
  vendedorPin: string;
  email?: string;
  phone?: string;
  image?: string; // URL for the store's logo or image
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  password?: string; // Not always exposed
  role: UserRole;
  tiendaId?: number;
  registrationDate: string;
}

export interface Product {
  id: number;
  name:string;
  image: string; // URL or base64 string
  price: number;
  unit: ProductUnit;
  priceDozen?: number; // Only applicable if unit is 'unidad'
  tiendaId: number;
}