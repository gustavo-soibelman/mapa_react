import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapaBrasil = () => {
  const [geojsons, setGeojsons] = useState([]);
  const centerBrasil = [-14.235, -51.9253];
  const zoomInicial = 4;

  useEffect(() => {
    const arquivos = import.meta.glob('../data/estados/*.json', { eager: true });

    const features = Object.values(arquivos)
      .map((mod) => (mod.default || mod))
      .filter((d) => d && d.type === 'FeatureCollection');

    setGeojsons(features);
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
            style={() => ({
              color: '#444',
              weight: 1,
              fillOpacity: 0,
            })}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapaBrasil;
