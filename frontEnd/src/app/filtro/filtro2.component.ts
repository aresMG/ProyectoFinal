import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../services/producto.service';
import { Producto } from '../models/producto';

import { Router } from '@angular/router';
import { SearchService } from '../search.service';

@Component({
  selector: 'app-filtro2',
  templateUrl: './filtro2.component.html',
  styleUrls: ['./filtro2.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})

export class Filtro2Component implements OnInit {
  products: Producto[] = [];
  displayedProducts: Producto[] = [];
  currentSort: string = 'relevance';
  minPrice: number = 0;
  maxPrice: number = 1300;
  filteredProducts: Producto[] = [];
  selectedCategories: string[] = [];
  searchTerm: string = '';
  brandSearchTerm: string = '';

  constructor(
    private productoService: ProductoService,
    private searchService: SearchService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.productoService.getAllProductos().subscribe({
      next: (productos) => {
        this.products = productos;
        this.filteredProducts = [...productos];
        this.displayedProducts = [...productos];
        console.log('Productos cargados:', productos);
        console.log('Categorías disponibles:', this.getCategoriesCount(productos));
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
      }
    });

    this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = term;
      this.aplicarTodosFiltros();
    });
  }

  // Helper para contar productos por categoría
  getCategoriesCount(productos: Producto[]): any {
    const categoryCounts: any = {};
    productos.forEach(p => {
      const cat = p.categoria?.toString().trim().toUpperCase() || 'SIN CATEGORÍA';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    return categoryCounts;
  }

  updatePriceFilter(): void {
    if (this.minPrice > this.maxPrice) {
      this.minPrice = this.maxPrice;
    }
    this.aplicarTodosFiltros();
  }

  sortProducts(sortType: string, productos: Producto[]): Producto[] {
    let sorted = [...productos];

    switch (sortType) {
      case 'price_asc':
        sorted.sort((a, b) => a.precio! - b.precio!);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.precio! - a.precio!);
        break;
      case 'relevance':
      default:
        break;
    }

    return sorted;
  }

  irAlProducto(id: number): void {


    if ('startViewTransition' in document) {
      document.startViewTransition(() => this.router.navigate(['/producto', id]));
    } else {
      this.router.navigate(['/producto', id]);
    }
  }

  onCategoryChange(event: any): void {
    const value = event.target.value;
    const normalizedValue = value.trim().toUpperCase();

    if (event.target.checked) {
      this.selectedCategories.push(normalizedValue);
    } else {
      this.selectedCategories = this.selectedCategories.filter(c => c !== normalizedValue);
    }

    console.log('Categorías seleccionadas:', this.selectedCategories);
  }

  // Método que aplica todos los filtros en orden correcto
  aplicarTodosFiltros(): void {
    let resultado = [...this.products];

    // 1. Aplicar filtro de búsqueda por término
    if (this.searchTerm) {
      resultado = resultado.filter(product =>
        product.nombre?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      console.log(`Después de filtro por término "${this.searchTerm}":`, resultado.length);
    }

    // 2. Aplicar filtro por categoría
    if (this.selectedCategories.length > 0) {
      const antesDelFiltro = resultado.length;
      resultado = resultado.filter(producto => {
        const productoCategoriaStr = producto.categoria ?
          producto.categoria.toString().trim().toUpperCase() : '';

        const match = this.selectedCategories.some(cat =>
          productoCategoriaStr === cat);


        return match;
      });
      console.log(`Filtro categorías: ${antesDelFiltro} -> ${resultado.length}`);
    }

    // 3. Filtro por marca (solo texto)
    if (this.brandSearchTerm.trim() !== '') {
      const terminoMarca = this.brandSearchTerm.trim().toLowerCase();
      resultado = resultado.filter(producto =>
        producto.marca?.toLowerCase().includes(terminoMarca)
      );
      console.log(`Filtro por marca "${this.brandSearchTerm}": ${resultado.length}`);
    }

    // 4. Aplicar filtro por precio
    const antesPrecio = resultado.length;
    resultado = resultado.filter(p =>
      p.precio! >= this.minPrice && p.precio! <= this.maxPrice
    );
    console.log(`Filtro precio: ${antesPrecio} -> ${resultado.length}`);

    // 5. Aplicar ordenación actual
    this.displayedProducts = this.sortProducts(this.currentSort, resultado);

    // Forzar detección de cambios por si acaso
    this.cdr.detectChanges();
  }

  borrarTodosFiltros() {
    this.searchTerm = '';
    this.minPrice = 0;
    this.maxPrice = 1300;
    this.selectedCategories = [];
    this.brandSearchTerm = '';

    // Limpiar checkboxes del DOM (si fuera necesario)
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox: any) => {
      checkbox.checked = false;
    });

    this.displayedProducts = [...this.products];
    this.cdr.detectChanges();
  }
}