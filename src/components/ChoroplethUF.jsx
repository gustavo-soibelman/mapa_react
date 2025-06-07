import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';
import estadosCSV from '../data/estados.csv?raw';
import _ from 'lodash';

const coresQuintil = ['#f0f0f0', '#c6dbef', '#9ecae1', '#6baed6', '#08519c'];

const ChoroplethUF = ({ experiencias = [], estadosSelecionados = [] }) => {
  const [geojsons, setGeojsons] = useState([]);
  const [dadosUF, setDadosUF] = useState({});
  const [mapaUFs, setMapaUFs] = useState({});

  const centerBrasil = [-14.235, -51.9253];
  const zoomInicial = 4;

  useEffect(() => {
    const estados = Papa.parse(estadosCSV, {
      header: true,
      skipEmptyLines: true,
    }).data;

    const mapa = {};
    estados.forEach((e) => {
      mapa[e.UF] = e.codigo_uf;
    });
    setMapaUFs(mapa);

    const arquivos = import.meta.glob('../data/estados/*.json', { eager: true });
    const geo = Object.values(arquivos)
      .map((mod) => mod.default || mod)
      .filter((d) => d.type === 'FeatureCollection');
    setGeojsons(geo);
  }, []);

  useEffect(() => {
    if (!experiencias.length || !Object.keys(mapaUFs).length) return;

    const contagemPorUF = _.countBy(experiencias, 'estado');

    const tabelaUF = Object.entries(mapaUFs).map(([sigla, codigo]) => {
      const total = contagemPorUF[sigla] || 0;
      return { UF: sigla, codigo_uf: codigo.toString(), total };
    });

    const totais = tabelaUF.map((d) => d.total);
    const quintilLimites = _.sortedUniq(
      _.map(_.range(1, 6), (i) =>
        _.nth(_.sortBy(totais), Math.floor((i - 1) * totais.length / 5))
      )
    );

    const dadosComQuintil = {};
    tabelaUF.forEach(({ UF, codigo_uf, total }) => {
      let classe = 0;
      for (let i = 0; i < quintilLimites.length; i++) {
        if (total >= quintilLimites[i]) classe = i + 1;
      }
      dadosComQuintil[codigo_uf] = { UF, codigo_uf, total, quintil: classe };
    });

    setDadosUF(dadosComQuintil);
  }, [experiencias, mapaUFs]);

  return (
    <div style={{ width: '100%', height: '500px', marginBottom: '30px' }}>
      <MapContainer center={centerBrasil} zoom={zoomInicial} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {geojsons.map((geojson, idx) => {
          if (Object.keys(dadosUF).length === 0) return null;

          return (
            <GeoJSON
              key={idx}
              data={geojson}
              style={(feature) => {
                const codigo = feature.properties.codarea?.toString();
                const visivel = estadosSelecionados.includes(codigo);
                if (!visivel) {
                  return { color: 'transparent', weight: 0, fillOpacity: 0 };
                }

                const info = dadosUF[codigo];
                const quintil = info?.quintil || 0;
                return {
                  color: '#333',
                  weight: 1,
                  fillColor: coresQuintil[quintil],
                  fillOpacity: 0.7,
                };
              }}
              onEachFeature={(feature, layer) => {
                const cod = feature.properties.codarea?.toString();
                const info = dadosUF?.[cod];
                if (info) {
                  layer.bindPopup(`UF: ${info.UF}<br/>Experiências: ${info.total}`);
                }
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ChoroplethUF;
