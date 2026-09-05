export const VERDICT_COLORS = {
  VERIFIED: '#15803d',  // Muted Forest Green
  REVIEW: '#b45309',    // Muted Amber
  WARNING: '#c2410c',   // Muted Orange
  BLOCKED: '#b91c1c',   // Muted Red
  STALLED: '#526174',   // Muted Slate
};

export const getVerdictBadgeClass = (verdict) => {
  switch (verdict) {
    case 'VERIFIED': return 'badge-verified';
    case 'REVIEW': return 'badge-review';
    case 'WARNING': return 'badge-warning';
    case 'BLOCKED': return 'badge-blocked';
    case 'STALLED': return 'badge-stalled';
    default: return 'badge-stalled';
  }
};

export const parcelsToGeoJSON = (parcels) => {
  return {
    type: 'FeatureCollection',
    features: parcels.map((parcel) => ({
      type: 'Feature',
      id: parcel.id,
      geometry: parcel.geometry,
      properties: {
        id: parcel.id,
        parcel_code: parcel.parcel_code,
        khasra_number: parcel.khasra_number,
        landowner_name: parcel.landowner_name || 'Unmapped Owner',
        current_stage: parcel.current_stage,
        compensation_status: parcel.compensation_status,
        confidence_score: parcel.confidence_score,
        verdict: parcel.verdict,
        color: VERDICT_COLORS[parcel.verdict] || '#526174',
      },
    })),
  };
};

export const parcelCentroidsToGeoJSON = (parcels) => {
  return {
    type: 'FeatureCollection',
    features: parcels
      .filter((p) => p.centroid && p.centroid.coordinates)
      .map((parcel) => ({
        type: 'Feature',
        id: `centroid-${parcel.id}`,
        geometry: parcel.centroid,
        properties: {
          id: parcel.id,
          parcel_code: parcel.parcel_code,
          khasra_number: parcel.khasra_number,
          verdict: parcel.verdict,
          confidence_score: parcel.confidence_score,
          color: VERDICT_COLORS[parcel.verdict] || '#526174',
        },
      })),
  };
};

export const DEFAULT_MAP_CENTER = [79.0890, 21.1465]; // Nagpur, MH
export const DEFAULT_MAP_ZOOM = 14.5;
