'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@kiraka/ui';
import { ShieldCheck, MapPin, ExternalLink, RefreshCw, AlertCircle, X } from 'lucide-react';

export interface MapItem {
  id: string;
  type: 'job' | 'provider';
  title: string;
  category: string;
  areaName: string;
  priceOrRating?: string;
  lat: number;
  lng: number;
  deepLink: string;
}

export const KIGALI_NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  kacyiru: [-1.935, 30.082],
  kimihurura: [-1.954, 30.078],
  kibagabaga: [-1.933, 30.116],
  nyarutarama: [-1.939, 30.100],
  remera: [-1.957, 30.113],
  kimironko: [-1.947, 30.126],
  gisozi: [-1.916, 30.063],
  kicukiro: [-1.986, 30.102],
  gikondo: [-1.971, 30.076],
  kanombe: [-1.975, 30.147],
  nyamirambo: [-1.978, 30.046],
  kagugu: [-1.908, 30.078],
};

export function getNeighborhoodCoords(areaName: string): [number, number] {
  const normalized = areaName.toLowerCase();
  for (const [key, coords] of Object.entries(KIGALI_NEIGHBORHOOD_COORDS)) {
    if (normalized.includes(key)) return coords;
  }
  // Default to Kigali city center
  return [-1.9441, 30.0619];
}

interface PrivacySafeMapProps {
  items: MapItem[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export default function PrivacySafeMap({
  items,
  center = [-1.9441, 30.0619],
  zoom = 12,
  className = 'h-[500px] w-full',
}: PrivacySafeMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [mapError, setMapError] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<MapItem | null>(null);

  React.useEffect(() => {
    let mapInstance: any = null;
    let isCancelled = false;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        // 1. Ensure MapLibre CSS is linked
        if (!document.getElementById('maplibre-css')) {
          const link = document.createElement('link');
          link.id = 'maplibre-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
          document.head.appendChild(link);
        }

        // 2. Dynamically load MapLibre JS script
        if (!(window as any).maplibregl) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('MapLibre script failed to load'));
            document.body.appendChild(script);
          });
        }

        if (isCancelled) return;
        const maplibregl = (window as any).maplibregl;

        // 3. Initialize Map with OpenFreeMap Bright style (D-010)
        mapInstance = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/bright',
          center: [center[1], center[0]], // [lng, lat]
          zoom,
          minZoom: 10,
          maxZoom: 16,
          attributionControl: false,
        });

        mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

        mapInstance.on('load', () => {
          if (isCancelled) return;
          setMapLoaded(true);

          // 4. Render privacy-safe circular buffers for items (BR-13)
          items.forEach((item, index) => {
            const circleId = `privacy-circle-${item.id}-${index}`;
            const fillId = `privacy-fill-${item.id}-${index}`;

            // Create circular GeoJSON polygon (~500m radius)
            const coords = createGeoJSONCircle([item.lng, item.lat], 0.5);

            mapInstance.addSource(circleId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: { id: item.id, title: item.title },
                geometry: {
                  type: 'Polygon',
                  coordinates: [coords],
                },
              },
            });

            // Circle fill (privacy area)
            mapInstance.addLayer({
              id: fillId,
              type: 'fill',
              source: circleId,
              paint: {
                'fill-color': item.type === 'job' ? '#2563eb' : '#059669',
                'fill-opacity': 0.22,
              },
            });

            // Circle outline
            mapInstance.addLayer({
              id: `${circleId}-line`,
              type: 'line',
              source: circleId,
              paint: {
                'line-color': item.type === 'job' ? '#2563eb' : '#059669',
                'line-width': 2,
                'line-dasharray': [2, 2],
              },
            });

            // Centroid label marker
            const el = document.createElement('div');
            el.className = 'kiraka-map-marker';
            const iconSvg = item.type === 'job'
              ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'
              : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="display:inline-block;vertical-align:middle"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

            el.innerHTML = `
              <div style="
                background: ${item.type === 'job' ? '#1E40AF' : '#15803D'};
                color: #FFFFFF;
                font-size: 11px;
                font-weight: 700;
                padding: 4px 9px;
                border-radius: 9999px;
                box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
                border: 1.5px solid #FFFFFF;
                font-family: inherit;
              ">
                ${iconSvg}
                <span>${item.priceOrRating || item.areaName.split(',')[0]}</span>
              </div>
            `;
            el.onclick = () => {
              setSelectedItem(item);
            };

            new maplibregl.Marker({ element: el })
              .setLngLat([item.lng, item.lat])
              .addTo(mapInstance);
          });
        });

        mapInstance.on('error', () => {
          if (!mapLoaded) setMapError(true);
        });
      } catch (err) {
        console.warn('Map initialization deferred or failed:', err);
        setMapError(true);
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstance) mapInstance.remove();
    };
  }, [items, center, zoom]);

  return (
    <div className={`relative rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] ${className}`}>
      {/* Privacy Guarantee Header Pill */}
      <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
        <div className="bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] rounded-full px-3 py-1.5 shadow-sm text-[11px] text-[var(--color-text-secondary)] flex items-center justify-between pointer-events-auto max-w-md mx-auto">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0" />
            <span className="truncate">
              <strong>Privacy Guaranteed:</strong> Coarse ~500m radius only (BR-13)
            </span>
          </div>
          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider ml-2">
            Kigali
          </span>
        </div>
      </div>

      {/* MapLibre Canvas Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Fallback View (Offline or Slow 3G) */}
      {mapError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-[var(--color-surface)] text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="font-bold text-[15px] text-[var(--color-text)]">
              Kigali Neighborhood Overview
            </h3>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Map tiles are currently operating in data-saver mode. You can still browse all active requests by neighborhood below.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]"
              >
                {item.areaName.split(',')[0]} · {item.type === 'job' ? 'Job' : 'Provider'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Item Floating Drawer / Card */}
      {selectedItem && (
        <div className="absolute bottom-3 left-3 right-3 z-20 max-w-sm mx-auto animate-in slide-in-from-bottom duration-200">
          <Card className="p-3.5 shadow-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Badge
                  status={selectedItem.type === 'job' ? 'open' : 'matched'}
                  label={selectedItem.type === 'job' ? 'Open Request' : 'Verified Provider'}
                />
                <h4 className="font-bold text-[14px] text-[var(--color-text)] mt-1 line-clamp-1">
                  {selectedItem.title}
                </h4>
                <p className="text-[12px] text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0" />
                  <span>{selectedItem.areaName} · {selectedItem.priceOrRating}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] p-1 rounded-full hover:bg-[var(--color-surface-2)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="pt-1 flex gap-2">
              <Link href={selectedItem.deepLink as any} className="w-full">
                <Button variant="primary" size="sm" fullWidth>
                  View Details <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Creates a GeoJSON circle polygon around center [lng, lat] with given radius in km.
 */
function createGeoJSONCircle(center: [number, number], radiusInKm: number, points = 32): [number, number][] {
  const coords: [number, number][] = [];
  const distanceX = radiusInKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = radiusInKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  // Close the polygon
  coords.push(coords[0]!);
  return coords;
}
