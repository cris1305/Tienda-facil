import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Product } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:5000/api';

  private products = signal<Product[]>([]);
  allProducts = this.products.asReadonly();

  async loadProducts(tiendaId: number) {
    if (!tiendaId) {
      this.products.set([]);
      return;
    }
    try {
      const products = await firstValueFrom(this.http.get<Product[]>(`${this.apiUrl}/tiendas/${tiendaId}/products`));
      this.products.set(products);
    } catch (error) {
      console.error("Failed to load products:", error);
      this.products.set([]);
    }
  }

  async addProduct(product: Omit<Product, 'id'>) {
    try {
      const newProduct = await firstValueFrom(
        this.http.post<Product>(`${this.apiUrl}/products`, product)
      );
      this.products.update(products => [...products, newProduct]);
    } catch (error) {
      console.error("Failed to add product:", error);
    }
  }

  async updateProduct(updatedProduct: Product) {
    try {
      // Fix: Explicitly type `returnedProduct` to fix type inference issue from `firstValueFrom`.
      const returnedProduct: Product = await firstValueFrom(
        this.http.put<Product>(`${this.apiUrl}/products/${updatedProduct.id}`, updatedProduct)
      );
      this.products.update(products => 
        products.map(p => p.id === returnedProduct.id ? returnedProduct : p)
      );
    } catch (error: unknown) {
      console.error("Failed to update product:", error);
    }
  }
}
