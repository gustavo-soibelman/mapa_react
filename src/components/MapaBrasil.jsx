import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';
import estadosCSV from '../data/estados.csv?raw';

const MapaBrasil = ({ estadosVisiveis = [] }) => {
  const [geojsons, setGeojsons] = useState([]);
  const centerBrasil = [-14.235, -51.9253];
  const zoomInicial = 4;

  useEffect(() => {
    const estadosMeta = Papa.parse(estadosCSV, {
      header: true,
      skipEmptyLines: true,
    }).data;

    const mapaCodigos = {};
    estadosMeta.forEach((linha) => {
      mapaCodigos[linha.codigo_uf] = linha.UF;
    });

    const arquivos = import.meta.glob('../data/estados/*.json', { eager: true });

    const features = Object.values(arquivos)
      .map((mod) => mod.default || mod)
      .filter((d) => d && d.type === 'FeatureCollection');

    const featuresComUF = features.map((geojson) => ({
      ...geojson,
      features: geojson.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          UF: mapaCodigos[f.properties.codarea],
        },
      })),
    }));

    setGeojsons(featuresComUF);
  }, []);

  return (
    <div style={{ width: '100%', height: '400px', marginBottom: '30px' }}>
      <MapContainer center={centerBrasil} zoom={zoomInicial} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Marker position={[-15.78, -47.93]}>
          <Popup>Brasília, DF</Popup>
        </Marker>

        {geojsons.map((geojson, idx) => (
          <GeoJSON
            key={idx}
            data={geojson}
            style={(feature) => {
              const codigo = feature.properties?.codarea?.toString();
              const visivel = estadosVisiveis.includes(codigo);
              return {
                color: visivel ? '#444' : 'transparent',
                weight: visivel ? 1 : 0,
                fillOpacity: 0,
              };
            }}
            onEachFeature={(feature, layer) => {
              if (feature.properties?.UF) {
                layer.bindPopup(`UF: ${feature.properties.UF}`);
              }
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapaBrasil;
