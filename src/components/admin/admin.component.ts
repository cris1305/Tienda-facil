import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { TiendaService } from '../../services/tienda.service';
import { Product, User, ProductUnit, Tienda } from '../../models';

type AdminView = 'products' | 'users' | 'settings';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  authService = inject(AuthService);
  productService = inject(ProductService);
  tiendaService = inject(TiendaService);

  currentView = signal<AdminView>('products');
  
  currentUser = this.authService.currentUser;
  
  // Signals for async data
  tienda = signal<Tienda | null>(null);
  allUsers = signal<User[]>([]);
  
  // This can remain computed as it depends on the product service's signal
  allProducts = this.productService.allProducts;

  pinUpdateSuccess = signal<string | null>(null);
  pinUpdateError = signal<string | null>(null);
  storeUpdateSuccess = signal<string | null>(null);
  storeUpdateError = signal<string | null>(null);

  isFormVisible = signal(false);
  editingProduct = signal<Product | null>(null);
  selectedUnit = signal<ProductUnit>('unidad');

  constructor() {
    // Load initial data when component is created
    this.loadAdminData();

    // Effect to reload data if the current view changes
    effect(() => {
      this.loadDataForView(this.currentView());
    });
  }
  
  async loadAdminData() {
    const user = this.currentUser();
    if (!user || !user.tiendaId) return;

    // Load all data needed for the admin panel initially
    await this.productService.loadProducts(user.tiendaId);
    this.loadDataForView(this.currentView());
  }
  
  async loadDataForView(view: AdminView) {
      const user = this.currentUser();
      if (!user || !user.tiendaId) return;

      switch(view) {
          case 'products':
              // Products are already loaded via productService
              break;
          case 'users':
              const users = await this.authService.getAllUsers(user.tiendaId);
              this.allUsers.set(users);
              break;
          case 'settings':
              const tiendaInfo = await this.tiendaService.getTiendaById(user.tiendaId);
              this.tienda.set(tiendaInfo);
              break;
      }
  }

  changeView(view: AdminView) {
    this.currentView.set(view);
    this.pinUpdateSuccess.set(null);
    this.pinUpdateError.set(null);
    this.storeUpdateSuccess.set(null);
    this.storeUpdateError.set(null);
  }

  showAddForm() {
    this.editingProduct.set(null);
    this.selectedUnit.set('unidad');
    this.isFormVisible.set(true);
  }

  showEditForm(product: Product) {
    this.editingProduct.set({ ...product });
    this.selectedUnit.set(product.unit);
    this.isFormVisible.set(true);
  }

  hideForm() {
    this.isFormVisible.set(false);
    this.editingProduct.set(null);
  }

  async saveProduct(form: NgForm) {
    const user = this.currentUser();
    if (form.invalid || !user || !user.tiendaId) return;
    
    const productData: Omit<Product, 'id' | 'tiendaId'> = {
        name: form.value.name,
        image: form.value.image,
        price: parseFloat(form.value.price),
        unit: form.value.unit,
        priceDozen: form.value.unit === 'unidad' && form.value.priceDozen ? parseFloat(form.value.priceDozen) : undefined
    };

    if (this.editingProduct()) {
      const updatedProduct: Product = { ...this.editingProduct()!, ...productData };
      await this.productService.updateProduct(updatedProduct);
    } else {
      const newProductData: Omit<Product, 'id'> = {
          ...productData,
          tiendaId: user.tiendaId
      }
      await this.productService.addProduct(newProductData);
    }

    this.hideForm();
    form.resetForm();
  }

  async updatePin(form: NgForm) {
    this.pinUpdateSuccess.set(null);
    this.pinUpdateError.set(null);
    if (form.invalid) {
      return;
    }

    const newPin = form.value.vendedorPin;
    const currentTienda = this.tienda();
    if (currentTienda) {
      const success = await this.tiendaService.updateVendedorPin(currentTienda.id, newPin);
      if (success) {
        this.pinUpdateSuccess.set('¡PIN de vendedor actualizado con éxito!');
        // Also refresh tienda data
        this.tienda.update(t => t ? { ...t, vendedorPin: newPin } : null);
        setTimeout(() => this.pinUpdateSuccess.set(null), 3000);
      } else {
        this.pinUpdateError.set('No se pudo actualizar el PIN. Inténtalo de nuevo.');
      }
    }
  }

  async updateStoreDetails(form: NgForm) {
    this.storeUpdateSuccess.set(null);
    this.storeUpdateError.set(null);
    if (form.invalid) return;

    const currentTienda = this.tienda();
    if (currentTienda) {
      const details = {
        name: form.value.tiendaName,
        email: form.value.tiendaEmail,
        phone: form.value.tiendaPhone,
        image: form.value.tiendaImage
      };
      
      const success = await this.tiendaService.updateTiendaDetails(currentTienda.id, details);

      if (success) {
        this.storeUpdateSuccess.set('¡Datos de la tienda actualizados con éxito!');
        this.tienda.update(t => t ? { ...t, ...details } : null);
        setTimeout(() => this.storeUpdateSuccess.set(null), 3000);
      } else {
        this.storeUpdateError.set('No se pudo actualizar la información. Inténtalo de nuevo.');
      }
    }
  }
}
