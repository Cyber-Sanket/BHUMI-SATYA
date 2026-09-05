import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import apiService from '../services/api';
import { parcelsToGeoJSON, VERDICT_COLORS, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, getVerdictBadgeClass } from '../services/mapUtils';
import { Eye, X } from 'lucide-react';
import { useSystemTheme } from '../services/useSystemTheme';

export default function MapView({ onSelectParcel }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const evidenceMarkersRef = useRef([]);
  const [parcels, setParcels] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [filterVerdict, setFilterVerdict] = useState('ALL');
  const systemTheme = useSystemTheme();
  
  // Layer toggles
  const [layers, setLayers] = useState({
    corridor: true,
    parcels: true,
    evidencePoints: true,
    alerts: true,
  });

  // Telemetry state
  const [coords, setCoords] = useState({ lat: 21.1458, lon: 79.0882, zoom: 14.5 });

  useEffect(() => {
    fetchParcels();
  }, []);

  const fetchParcels = async () => {
    try {
      const res = await apiService.getParcels();
      setParcels(res.data);
    } catch (err) {
      console.error('Failed to fetch map parcels:', err);
    }
  };

  const getMapStyle = (theme) => {
    return theme === 'dark'
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
  };

  // Clear existing HTML markers
  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    evidenceMarkersRef.current.forEach((m) => m.remove());
    evidenceMarkersRef.current = [];
  };

  // Render compact technical GIS parcel labels & evidence markers
  const renderGISMarkers = (map, dataParcels, currentSelected, currentTheme) => {
    clearMarkers();
    if (!map) return;

    // Filter parcels according to current verdict filter
    const visibleParcels = dataParcels.filter((p) => {
      if (filterVerdict === 'ALL') return true;
      if (filterVerdict === 'WARNING') return p.verdict === 'REVIEW';
      return p.verdict === filterVerdict;
    });

    if (!layers.parcels) return;

    visibleParcels.forEach((parcel) => {
      if (!parcel.centroid || !parcel.centroid.coordinates) return;

      const isSelected = currentSelected?.id === parcel.id;
      const statusColor = VERDICT_COLORS[parcel.verdict] || '#526174';

      // Create compact technical GIS Label HTML Element
      const el = document.createElement('div');
      el.className = 'gis-parcel-label';
      el.style.cssText = `
        font-family: 'IBM Plex Mono', monospace;
        font-size: 9px;
        font-weight: ${isSelected ? '700' : '600'};
        padding: 1px 5px;
        background: ${currentTheme === 'dark' ? (isSelected ? '#1b2430' : '#151c25') : (isSelected ? '#f8fafc' : '#ffffff')};
        color: ${currentTheme === 'dark' ? '#e7ecf2' : '#172033'};
        border: ${isSelected ? '1.5px solid #15803d' : '1px solid ' + (currentTheme === 'dark' ? '#2b3644' : '#cbd5e1')};
        border-radius: 2px;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
        opacity: ${isSelected ? '1' : '0.88'};
        z-index: ${isSelected ? '10' : '1'};
        transform: translate(-50%, -50%);
        transition: all 0.15s ease;
      `;

      // Compact status color indicator dot
      const dot = document.createElement('span');
      dot.style.cssText = `
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: ${statusColor};
        display: inline-block;
        flex-shrink: 0;
      `;

      const text = document.createElement('span');
      text.innerText = parcel.parcel_code;

      el.appendChild(dot);
      el.appendChild(text);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedParcel(parcel);
        map.flyTo({ center: parcel.centroid.coordinates, zoom: 16.5, essential: true });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(parcel.centroid.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Evidence location marker & ~51.2km mismatch annotation for MH-NGP-0143
    if (layers.evidencePoints) {
      const blockedParcel = dataParcels.find((p) => p.parcel_code === 'MH-NGP-0143');
      if (blockedParcel && blockedParcel.centroid) {
        const parcelCoords = blockedParcel.centroid.coordinates; // [79.09015, 21.1475]
        const evidenceCoords = [78.8500, 20.6850]; // Wardha field capture location

        // 1. Compact Field Evidence Marker at Wardha location
        const evEl = document.createElement('div');
        evEl.className = 'gis-evidence-label';
        evEl.style.cssText = `
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          background: ${currentTheme === 'dark' ? '#2d0a0a' : '#fef2f2'};
          color: ${currentTheme === 'dark' ? '#f87171' : '#b91c1c'};
          border: 1px solid #b91c1c;
          border-radius: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          white-space: nowrap;
          transform: translate(-50%, -50%);
        `;

        evEl.innerHTML = `
          <span style="width:5px; height:5px; background:#b91c1c; border-radius:50%; display:inline-block;"></span>
          <span>FIELD CAPTURE (MH-NGP-0143) • MISMATCH</span>
        `;

        evEl.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedParcel(blockedParcel);
          map.flyTo({ center: evidenceCoords, zoom: 12, essential: true });
        });

        const evMarker = new maplibregl.Marker({ element: evEl })
          .setLngLat(evidenceCoords)
          .addTo(map);

        evidenceMarkersRef.current.push(evMarker);

        // 2. Mismatch Distance Annotation Banner midway along the line
        const midPoint = [
          (parcelCoords[0] + evidenceCoords[0]) / 2,
          (parcelCoords[1] + evidenceCoords[1]) / 2
        ];

        const bannerEl = document.createElement('div');
        bannerEl.style.cssText = `
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          background: ${currentTheme === 'dark' ? '#1b2430' : '#ffffff'};
          color: #b91c1c;
          border-left: 2.5px solid #b91c1c;
          border-top: 1px solid ${currentTheme === 'dark' ? '#2b3644' : '#cbd5e1'};
          border-right: 1px solid ${currentTheme === 'dark' ? '#2b3644' : '#cbd5e1'};
          border-bottom: 1px solid ${currentTheme === 'dark' ? '#2b3644' : '#cbd5e1'};
          border-radius: 2px;
          text-align: center;
          line-height: 1.2;
          pointer-events: none;
          transform: translate(-50%, -50%);
        `;
        bannerEl.innerHTML = `
          <div style="font-size: 8px; opacity: 0.75; color: ${currentTheme === 'dark' ? '#9aa8b8' : '#526174'};">PARCEL LOCATION</div>
          <div style="color: #b91c1c; font-weight: 800; font-size: 9px;">↕ ~51.2 KM MISMATCH ↕</div>
          <div style="font-size: 8px; opacity: 0.75; color: ${currentTheme === 'dark' ? '#9aa8b8' : '#526174'};">FIELD EVIDENCE</div>
        `;

        const bannerMarker = new maplibregl.Marker({ element: bannerEl })
          .setLngLat(midPoint)
          .addTo(map);

        evidenceMarkersRef.current.push(bannerMarker);
      }
    }
  };

  const addParcelLayers = (map, dataParcels, currentTheme) => {
    if (dataParcels.length === 0) return;
    const geojson = parcelsToGeoJSON(dataParcels);

    // Source for parcels
    if (!map.getSource('parcels-data')) {
      map.addSource('parcels-data', {
        type: 'geojson',
        data: geojson,
      });

      // Parcel fill layer (polygon remains visible underneath)
      map.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'parcels-data',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': currentTheme === 'dark' ? 0.45 : 0.35,
        },
      });

      // Parcel boundaries line layer
      map.addLayer({
        id: 'parcels-line',
        type: 'line',
        source: 'parcels-data',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
        },
      });

      // Selected parcel outline highlight
      map.addLayer({
        id: 'parcels-highlight',
        type: 'line',
        source: 'parcels-data',
        paint: {
          'line-color': '#15803d',
          'line-width': 3.5,
          'line-opacity': 1,
        },
        filter: ['==', ['get', 'id'], ''],
      });

      map.on('click', 'parcels-fill', (e) => {
        const feature = e.features[0];
        if (!feature) return;

        const props = feature.properties;
        const targetParcel = dataParcels.find((p) => p.id === props.id);
        if (targetParcel) {
          setSelectedParcel(targetParcel);
          if (targetParcel.centroid && targetParcel.centroid.coordinates) {
            map.flyTo({ center: targetParcel.centroid.coordinates, zoom: 16.5, essential: true });
          }
        }
      });

      map.on('mouseenter', 'parcels-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'parcels-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    } else {
      map.getSource('parcels-data').setData(geojson);
    }

    // 51km Mismatch Line Source & Layer for MH-NGP-0143
    const blockedParcel = dataParcels.find((p) => p.parcel_code === 'MH-NGP-0143');
    if (blockedParcel && blockedParcel.centroid) {
      const lineGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                blockedParcel.centroid.coordinates, // [79.09015, 21.1475]
                [78.8500, 20.6850]                    // Field capture location
              ],
            },
            properties: {
              title: '51km GPS Mismatch Line',
            },
          },
        ],
      };

      if (!map.getSource('mismatch-line-data')) {
        map.addSource('mismatch-line-data', {
          type: 'geojson',
          data: lineGeoJSON,
        });

        map.addLayer({
          id: 'mismatch-line-layer',
          type: 'line',
          source: 'mismatch-line-data',
          paint: {
            'line-color': '#b91c1c',
            'line-width': 2,
            'line-dasharray': [4, 4],
          },
        });
      } else {
        map.getSource('mismatch-line-data').setData(lineGeoJSON);
      }
    }

    renderGISMarkers(map, dataParcels, selectedParcel, currentTheme);
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(systemTheme),
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      pitch: 0,
    });

    mapInstance.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('move', () => {
      const center = map.getCenter();
      setCoords({
        lat: center.lat,
        lon: center.lng,
        zoom: map.getZoom(),
      });
    });

    map.on('load', () => {
      addParcelLayers(map, parcels, systemTheme);
    });

    return () => {
      clearMarkers();
      map.remove();
    };
  }, []);

  // Update map style on systemTheme change dynamically without reload
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    map.setStyle(getMapStyle(systemTheme));
    
    const handleStyleData = () => {
      if (map.isStyleLoaded()) {
        addParcelLayers(map, parcels, systemTheme);
        map.off('styledata', handleStyleData);
      }
    };

    map.on('styledata', handleStyleData);
  }, [systemTheme]);

  // Update parcel data filtering & markers
  useEffect(() => {
    if (mapInstance.current && mapInstance.current.getSource('parcels-data')) {
      const filtered = parcels.filter((p) => {
        if (filterVerdict === 'ALL') return true;
        if (filterVerdict === 'WARNING') return p.verdict === 'REVIEW';
        return p.verdict === filterVerdict;
      });

      const geojson = parcelsToGeoJSON(filtered);
      mapInstance.current.getSource('parcels-data').setData(geojson);
      renderGISMarkers(mapInstance.current, parcels, selectedParcel, systemTheme);
    }
  }, [parcels, filterVerdict, selectedParcel, layers]);

  // Update selection highlight filter
  useEffect(() => {
    if (mapInstance.current && mapInstance.current.getLayer('parcels-highlight')) {
      mapInstance.current.setFilter('parcels-highlight', [
        '==',
        ['get', 'id'],
        selectedParcel ? selectedParcel.id : '',
      ]);
    }
  }, [selectedParcel]);

  // Toggle Layer visibility
  const toggleLayer = (layerKey) => {
    const updated = { ...layers, [layerKey]: !layers[layerKey] };
    setLayers(updated);

    if (mapInstance.current && mapInstance.current.getLayer('parcels-fill')) {
      const visibility = updated.parcels ? 'visible' : 'none';
      mapInstance.current.setLayoutProperty('parcels-fill', 'visibility', visibility);
      mapInstance.current.setLayoutProperty('parcels-line', 'visibility', visibility);
    }

    if (mapInstance.current && mapInstance.current.getLayer('mismatch-line-layer')) {
      const evVisibility = updated.evidencePoints ? 'visible' : 'none';
      mapInstance.current.setLayoutProperty('mismatch-line-layer', 'visibility', evVisibility);
    }
  };

  const handleZoomToParcel = (parcel) => {
    setSelectedParcel(parcel);
    if (!mapInstance.current || !parcel.centroid) return;
    const coords = parcel.centroid.coordinates;
    mapInstance.current.flyTo({
      center: coords,
      zoom: 16.5,
      essential: true,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] w-full select-none theme-bg-app">
      
      {/* Main Workspace Area (25% Left Panel, 75% Map) */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* 25% LEFT CONTROL PANEL */}
        <div className="w-full md:w-[25%] max-w-xs theme-bg-surface border-r theme-border p-4 flex flex-col justify-between shrink-0 z-10 space-y-4 font-mono text-xs overflow-y-auto">
          
          <div className="space-y-4">
            <div className="border-b theme-border pb-2">
              <span className="text-[10px] theme-text-secondary uppercase tracking-widest block font-bold">02 GIS CONTROL</span>
              <h2 className="text-xs font-bold theme-text-primary uppercase">CADASTRAL SURVEY WORKSTATION</h2>
            </div>

            {/* LAYERS CHECKBOX SECTION */}
            <div className="space-y-2">
              <span className="text-[10px] theme-text-secondary font-bold uppercase tracking-wider block border-b theme-border pb-1">
                LAYERS
              </span>
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer theme-text-primary font-medium">
                  <input
                    type="checkbox"
                    checked={layers.corridor}
                    onChange={() => toggleLayer('corridor')}
                    className="accent-slate-800 rounded-none h-3.5 w-3.5"
                  />
                  <span>☑ Corridor Boundary</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer theme-text-primary font-medium">
                  <input
                    type="checkbox"
                    checked={layers.parcels}
                    onChange={() => toggleLayer('parcels')}
                    className="accent-slate-800 rounded-none h-3.5 w-3.5"
                  />
                  <span>☑ Parcels Geometry & Labels</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer theme-text-primary font-medium">
                  <input
                    type="checkbox"
                    checked={layers.evidencePoints}
                    onChange={() => toggleLayer('evidencePoints')}
                    className="accent-slate-800 rounded-none h-3.5 w-3.5"
                  />
                  <span>☑ Evidence & 51km Mismatch</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer theme-text-primary font-medium">
                  <input
                    type="checkbox"
                    checked={layers.alerts}
                    onChange={() => toggleLayer('alerts')}
                    className="accent-slate-800 rounded-none h-3.5 w-3.5"
                  />
                  <span>☑ Incidents & Alerts</span>
                </label>
              </div>
            </div>

            {/* FILTER BUTTON SECTION */}
            <div className="space-y-2">
              <span className="text-[10px] theme-text-secondary font-bold uppercase tracking-wider block border-b theme-border pb-1">
                FILTER BY VERDICT
              </span>
              <div className="flex flex-wrap gap-1 pt-1">
                {['ALL', 'VERIFIED', 'REVIEW', 'WARNING', 'BLOCKED'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilterVerdict(v)}
                    className={`px-2 py-1 border text-[10px] font-bold uppercase tracking-tight transition-colors ${
                      filterVerdict === v
                        ? 'theme-bg-secondary theme-text-primary border-slate-700 font-extrabold'
                        : 'theme-bg-surface theme-text-secondary theme-border hover:theme-bg-secondary'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* PARCELS QUICK SELECT LIST */}
            <div className="space-y-2">
              <span className="text-[10px] theme-text-secondary font-bold uppercase tracking-wider block border-b theme-border pb-1">
                PARCELS REGISTER ({parcels.length})
              </span>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {parcels
                  .filter((p) => {
                    if (filterVerdict === 'ALL') return true;
                    if (filterVerdict === 'WARNING') return p.verdict === 'REVIEW';
                    return p.verdict === filterVerdict;
                  })
                  .map((parcel) => (
                    <div
                      key={parcel.id}
                      onClick={() => handleZoomToParcel(parcel)}
                      className={`p-2 border cursor-pointer text-xs transition-colors ${
                        selectedParcel?.id === parcel.id
                          ? 'theme-bg-secondary theme-text-primary theme-border font-bold border-l-4 border-l-emerald-600'
                          : 'theme-bg-surface theme-border theme-text-primary hover:theme-bg-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{parcel.parcel_code}</span>
                        <span className={`px-1.5 py-0.2 text-[9px] ${getVerdictBadgeClass(parcel.verdict)}`}>
                          {parcel.verdict}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] theme-text-secondary pt-1">
                        <span>KHASRA: {parcel.khasra_number}</span>
                        <span>CONF: {parcel.confidence_score}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>

          <div className="pt-2 border-t theme-border text-[10px] theme-text-secondary space-y-1">
            <div>PROJECT: NAGPUR METRO CORRIDOR</div>
            <div>CRS: EPSG:4326 (WGS84)</div>
            <div>THEME: {systemTheme.toUpperCase()} MODE</div>
          </div>
        </div>

        {/* 75% MAP DOMINANT WORKSPACE */}
        <div className="w-full md:w-[75%] flex-1 h-full relative">
          <div ref={mapContainer} className="w-full h-full" />

          {/* PARCEL INSPECTION DRAWER OVER MAP */}
          {selectedParcel && (
            <div className="absolute right-4 top-4 w-80 inst-panel p-4 z-20 shadow-md space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b theme-border pb-2">
                <div>
                  <h3 className="font-bold theme-text-primary text-sm">{selectedParcel.parcel_code}</h3>
                  <span className="text-[10px] theme-text-secondary">KHASRA {selectedParcel.khasra_number}</span>
                </div>
                <button
                  onClick={() => setSelectedParcel(null)}
                  className="theme-text-secondary hover:theme-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 theme-text-primary">
                <div>
                  <span className="text-[10px] theme-text-secondary uppercase block">LANDOWNER</span>
                  <span className="font-bold theme-text-primary">{selectedParcel.landowner_name}</span>
                </div>
                <div>
                  <span className="text-[10px] theme-text-secondary uppercase block">CURRENT STAGE</span>
                  <span className="font-bold text-emerald-600">{selectedParcel.current_stage}</span>
                </div>
                <div>
                  <span className="text-[10px] theme-text-secondary uppercase block">VERDICT</span>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold ${getVerdictBadgeClass(selectedParcel.verdict)}`}>
                    {selectedParcel.verdict} ({selectedParcel.confidence_score}%)
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectParcel && onSelectParcel(selectedParcel)}
                className="w-full py-1.5 theme-bg-secondary border theme-border theme-text-primary hover:opacity-90 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors rounded-sm"
              >
                <Eye className="h-3.5 w-3.5" />
                INSPECT DIGITAL TWIN
              </button>
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM MAP STATUS / TELEMETRY BAR */}
      <div className="theme-bg-secondary theme-text-primary px-4 py-1.5 text-[11px] font-mono flex flex-wrap items-center justify-between border-t theme-border shrink-0 z-20">
        <div className="flex items-center gap-6">
          <span><strong className="theme-text-secondary">COORDINATES:</strong> LAT {coords.lat.toFixed(6)} | LON {coords.lon.toFixed(6)}</span>
          <span><strong className="theme-text-secondary">ZOOM:</strong> {coords.zoom.toFixed(1)}</span>
          <span><strong className="theme-text-secondary">PROJECTION:</strong> EPSG:4326</span>
        </div>
        <div className="flex items-center gap-4 theme-text-secondary text-[10px]">
          <span>SOURCE: POSTGIS ENGINE</span>
          <span>TILES: {systemTheme === 'dark' ? 'DARK MATTER' : 'POSITRON'}</span>
          <span>SYSTEM THEME: {systemTheme.toUpperCase()}</span>
        </div>
      </div>

    </div>
  );
}
