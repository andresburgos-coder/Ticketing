
import { Component, OnInit, Input, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var L: any;

@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #mapContainer
      class="w-full h-full rounded-xl overflow-hidden"
      style="min-height: 256px; background: #f3f4f6;">
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class MapViewerComponent implements OnInit, OnDestroy {
  @Input() location: string = '';
  @Input() venueName?: string;

  private map: any;
  private marker: any;

  ngOnInit() {
    if (!this.location) return;

    // Dinámicamente importar leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Dinámicamente cargar Leaflet
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      setTimeout(() => this.initializeMap(), 100);
    };
    document.head.appendChild(script);
  }

  private initializeMap() {
    if (!L) return;

    const mapContainer = document.querySelector('app-map-viewer div');
    if (!mapContainer) return;

    // Coordenadas por defecto (Cali, Colombia si es la dirección dada)
    let lat = 3.4372;
    let lng = -76.5265;

    // Geocodificación simple basada en la ubicación
    if (this.location.toLowerCase().includes('cali')) {
      lat = 3.4372;
      lng = -76.5265;
    } else if (this.location.toLowerCase().includes('madrid')) {
      lat = 40.4168;
      lng = -3.7038;
    } else if (this.location.toLowerCase().includes('new york')) {
      lat = 40.7128;
      lng = -74.006;
    } else if (this.location.toLowerCase().includes('paris')) {
      lat = 48.8566;
      lng = 2.3522;
    } else if (this.location.toLowerCase().includes('barcelona')) {
      lat = 41.3851;
      lng = 2.1734;
    } else if (this.location.toLowerCase().includes('mexico')) {
      lat = 19.4326;
      lng = -99.1332;
    }

    // Crear mapa
    this.map = L.map(mapContainer).setView([lat, lng], 15);

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Agregar marcador
    this.marker = L.marker([lat, lng]).addTo(this.map);

    // Popup con información
    const popupText = this.venueName ? `<strong>${this.venueName}</strong><br>${this.location}` : this.location;
    this.marker.bindPopup(popupText).openPopup();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
