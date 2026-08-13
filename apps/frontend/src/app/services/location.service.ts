import { Injectable, signal } from '@angular/core';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  location = signal<LocationState>({
    latitude: null,
    longitude: null,
    locationName: null,
    loading: false,
    error: null
  });

  fetchCurrentLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.location.set({
        latitude: null,
        longitude: null,
        locationName: null,
        loading: false,
        error: 'Geolocalização não suportada neste navegador.'
      });
      return;
    }

    this.location.update(s => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.location.set({
          latitude: lat,
          longitude: lng,
          locationName: 'Buscando endereço...',
          loading: true,
          error: null
        });

        // Reverse geocoding via Nominatim
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: {
              'User-Agent': 'NoticiaTodaHora-PWA/1.0'
            }
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || 'Cidade não identificada';
            const neighbourhood = addr.suburb || addr.neighbourhood || addr.road || '';
            const state = addr.state ? `, ${addr.state}` : '';
            
            const place = neighbourhood ? `${city}${state} (${neighbourhood})` : `${city}${state}`;
            
            this.location.set({
              latitude: lat,
              longitude: lng,
              locationName: place || data.display_name,
              loading: false,
              error: null
            });
            return;
          }
        } catch (e) {
          console.warn('Falha na geocodificação reversa do frontend:', e);
        }

        // Fallback if reverse geocode request fails or offline
        this.location.set({
          latitude: lat,
          longitude: lng,
          locationName: `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          loading: false,
          error: null
        });
      },
      (error) => {
        let msg = 'Erro ao obter localização.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permissão de GPS negada pelo usuário.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Sinal de GPS indisponível no momento.';
        }
        this.location.set({
          latitude: null,
          longitude: null,
          locationName: null,
          loading: false,
          error: msg
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }
}
