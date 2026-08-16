'use client'

import { useEffect, useMemo, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

export type DistrictStat = {
  code: string
  name: string
  count: number
  checkins: number
}

type DistrictProperties = {
  district?: string
}

type Hovered = {
  name: string
  count: number
  checkins: number
  secondary?: string
}

const MAP_URL = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/topojson/states/maharashtra.json'

type MaharashtraTopology = {
  objects: {
    districts: unknown
  }
}

const districtCodeByMapName: Record<string, string> = {
  Gondia: 'GON',
  Bhandara: 'BHA',
  Jalgaon: 'JAL',
  Wardha: 'WAR',
  Buldhana: 'BUL',
  Akola: 'AKO',
  Nashik: 'NAS',
  Gadchiroli: 'GAD',
  Washim: 'WAS',
  Chandrapur: 'CHA',
  Yavatmal: 'YAV',
  Jalna: 'JNA',
  Ahmednagar: 'AHM',
  Hingoli: 'HIN',
  Nanded: 'NAN',
  Parbhani: 'PAR',
  Pune: 'PUN',
  Beed: 'BEE',
  Latur: 'LAT',
  Osmanabad: 'DHA',
  Solapur: 'SOL',
  Satara: 'SAT',
  Ratnagiri: 'RAT',
  Sangli: 'SAN',
  Kolhapur: 'KOL',
  Sindhudurg: 'SIN',
  Thane: 'THA',
  Palghar: 'PAL',
  Nandurbar: 'NDB',
  Amravati: 'AMR',
  Dhule: 'DHU',
  Nagpur: 'NAG',
  Aurangabad: 'AUR',
  Raigad: 'RAI',
}

function colourForCount(count: number, max: number) {
  if (count <= 0) return 'var(--map-zero)'
  if (max <= 0) return 'var(--map-low)'
  const ratio = count / max
  if (ratio >= 0.66) return 'var(--map-high)'
  if (ratio >= 0.33) return 'var(--map-medium)'
  return 'var(--map-low)'
}

function displayName(mapName: string) {
  if (mapName === 'Ahmednagar') return 'Ahilyanagar'
  if (mapName === 'Aurangabad') return 'Chhatrapati Sambhajinagar'
  if (mapName === 'Osmanabad') return 'Dharashiv'
  return mapName
}

export function MaharashtraDistrictMap({ districts }: { districts: DistrictStat[] }) {
  const [features, setFeatures] = useState<Feature<Geometry, DistrictProperties>[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<Hovered | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(MAP_URL)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load Maharashtra map data')
        return response.json()
      })
      .then((topology: MaharashtraTopology) => {
        if (cancelled) return
        const converted = feature(
          topology as never,
          topology.objects.districts as never
        ) as unknown as FeatureCollection<Geometry, DistrictProperties>
        setFeatures(converted.features)
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const statsByCode = useMemo(() => new Map(districts.map((district) => [district.code, district])), [districts])
  const maxCount = useMemo(() => Math.max(0, ...districts.map((district) => Number(district.count) || 0)), [districts])

  const projected = useMemo(() => {
    if (!features.length) return []
    const collection: FeatureCollection<Geometry, DistrictProperties> = {
      type: 'FeatureCollection',
      features,
    }
    const projection = geoMercator().fitExtent([[20, 20], [780, 570]], collection)
    const path = geoPath(projection)

    return features.map((districtFeature) => ({
      feature: districtFeature,
      d: path(districtFeature) ?? '',
      centroid: path.centroid(districtFeature),
    }))
  }, [features])

  function statsFor(mapName: string): Hovered {
    if (mapName === 'Mumbai') {
      const city = statsByCode.get('MCI')
      const suburban = statsByCode.get('MSU')
      const cityCount = Number(city?.count ?? 0)
      const suburbanCount = Number(suburban?.count ?? 0)
      return {
        name: 'Mumbai',
        count: cityCount + suburbanCount,
        checkins: Number(city?.checkins ?? 0) + Number(suburban?.checkins ?? 0),
        secondary: `Mumbai City ${cityCount} · Mumbai Suburban ${suburbanCount}`,
      }
    }

    const code = districtCodeByMapName[mapName]
    const stat = code ? statsByCode.get(code) : undefined
    return {
      name: displayName(mapName),
      count: Number(stat?.count ?? 0),
      checkins: Number(stat?.checkins ?? 0),
    }
  }

  if (loadError) {
    return <div className="mapError">{loadError}. District totals are still available in the table below.</div>
  }

  if (!projected.length) {
    return <div className="mapLoading">Loading Maharashtra district map…</div>
  }

  return (
    <div className="mapFrame">
      <div className="mapLegend">
        <span><i className="legendDot high" />High</span>
        <span><i className="legendDot medium" />Medium</span>
        <span><i className="legendDot low" />Low</span>
        <span><i className="legendDot zero" />Zero</span>
      </div>

      <div className="mapCanvas">
        <svg viewBox="0 0 800 600" role="img" aria-label="Maharashtra district-wise registrations map">
          {projected.map(({ feature: districtFeature, d, centroid }) => {
            const mapName = districtFeature.properties?.district ?? 'Unknown'
            const stat = statsFor(mapName)
            const isHovered = hovered?.name === stat.name
            return (
              <g key={`${mapName}-${d.slice(0, 16)}`}>
                <path
                  d={d}
                  className={`districtShape ${isHovered ? 'hovered' : ''}`}
                  fill={colourForCount(stat.count, maxCount)}
                  onMouseEnter={() => setHovered(stat)}
                  onMouseLeave={() => setHovered(null)}
                />
                {stat.count > 0 && Number.isFinite(centroid[0]) && Number.isFinite(centroid[1]) ? (
                  <text x={centroid[0]} y={centroid[1]} className="districtCountLabel" pointerEvents="none">
                    {stat.count}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>

        <div className="mapTooltipPanel">
          {hovered ? (
            <>
              <strong>{hovered.name}</strong>
              <span>Registrations <b>{hovered.count.toLocaleString('en-IN')}</b></span>
              <span>Check-ins <b>{hovered.checkins.toLocaleString('en-IN')}</b></span>
              {hovered.secondary ? <small>{hovered.secondary}</small> : null}
            </>
          ) : (
            <>
              <strong>District details</strong>
              <span>Hover a district to see live registrations and check-ins.</span>
            </>
          )}
        </div>
      </div>
      <p className="mapSourceNote">Demo map geometry is sourced from an open TopoJSON boundary dataset. Mumbai is a combined geometry on this map; state totals and the table retain separate Mumbai City and Mumbai Suburban records.</p>
    </div>
  )
}
