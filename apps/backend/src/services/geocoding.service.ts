export interface GeocodingResult {
  address: string;
  city: string;
  state: string;
  country: string;
  raw: any;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NoticiaTodaHora-FieldJournalism/1.0 (contato@noticiatodahora.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const addr = data.address || {};

    const city = addr.city || addr.town || addr.village || addr.municipality || 'Cidade não identificada';
    const state = addr.state || addr.region || '';
    const country = addr.country || 'Brasil';
    const neighbourhood = addr.suburb || addr.neighbourhood || addr.road || '';
    
    const formattedLocation = neighbourhood ? `${city} - ${state} (${neighbourhood})` : `${city} - ${state}`;

    return {
      address: formattedLocation,
      city,
      state,
      country,
      raw: data
    };
  } catch (error) {
    console.error('[Geocoding Service] Failed reverse geocode:', error);
    return {
      address: `Lat: ${latitude}, Lng: ${longitude}`,
      city: 'Desconhecida',
      state: '',
      country: 'Brasil',
      raw: null
    };
  }
}
