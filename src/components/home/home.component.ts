
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { GeminiService } from '../../services/gemini.service';
import { Product } from '../../models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnDestroy {
  productService = inject(ProductService);
  geminiService = inject(GeminiService);
  authService = inject(AuthService);

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;

  searchTerm = signal('');
  isCameraOpen = signal(false);
  isProcessing = signal(false);
  cameraError = signal<string | null>(null);
  geminiError = signal<string | null>(null);
  
  private mediaStream: MediaStream | null = null;
  private currentUser = this.authService.currentUser;

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const products = this.productService.allProducts(); // This is now reactive to loads
    if (!term) {
      return products;
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(term)
    );
  });
  
  constructor() {
    effect(() => {
      const videoEl = this.videoElement?.nativeElement;
      if (this.isCameraOpen() && this.mediaStream && videoEl) {
        videoEl.srcObject = this.mediaStream;
        videoEl.play();
      }
    });

    // Load products when the component initializes or user changes
    effect(() => {
      const user = this.currentUser();
      if (user && user.tiendaId) {
        this.productService.loadProducts(user.tiendaId);
      }
    });
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    this.geminiError.set(null);
    this.cameraError.set(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        this.isCameraOpen.set(true);
      } catch (err: unknown) {
        console.error("Error accessing camera: ", err);
        let errorMessage = 'No se pudo acceder a la cámara. Por favor, revisa los permisos e inténtalo de nuevo.';
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage = 'Se denegó el acceso a la cámara. Por favor, habilita los permisos de la cámara en la configuración de tu navegador para usar esta función.';
          } else if (err.name === 'NotFoundError') {
            errorMessage = 'No se encontró ninguna cámara en este dispositivo.';
          }
        }
        this.cameraError.set(errorMessage);
        this.isCameraOpen.set(false);
      }
    } else {
        this.cameraError.set('Cámara no compatible con este navegador.');
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    this.isCameraOpen.set(false);
    this.mediaStream = null;
  }

  async captureAndSearch() {
    if (!this.videoElement || !this.canvasElement) return;

    this.isProcessing.set(true);
    this.geminiError.set(null);

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];

        this.stopCamera();

        try {
            const productName = await this.geminiService.identifyProductFromImage(base64Data);
            this.searchTerm.set(productName);
        } catch (error) {
            console.error(error);
            this.geminiError.set('No se pudo identificar el producto. Por favor, inténtalo de nuevo.');
        } finally {
            this.isProcessing.set(false);
        }
    } else {
        this.geminiError.set('No se pudo procesar la imagen.');
        this.isProcessing.set(false);
    }
  }

  clearSearch() {
    this.searchTerm.set('');
  }
}
