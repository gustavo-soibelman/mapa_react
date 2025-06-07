import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';
import estadosCSV from '../data/estados.csv?raw';
import _ from 'lodash';

const coresQuintil = ['#f2efe9', '#c6dbef', '#9ecae1', '#6baed6', '#08519c'];

const Legenda = ({ limites }) => {
  const faixas = limites.map((lim, i) => {
    const inicio = lim;
    const fim = limites[i + 1] ? limites[i + 1] - 1 : 'ou mais';
    return `${inicio}–${fim}`;
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#f2efe9',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 0 5px rgba(0,0,0,0.3)',
        fontSize: '14px',
        zIndex: 1000,
      }}
    >
      <strong>Legenda (Experiências)</strong>
      <div>
        {faixas.map((faixa, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
            <div style={{ width: '20px', height: '12px', backgroundColor: coresQuintil[idx], marginRight: '8px', opacity: 0.5, border: "1px solid black" }}></div>
            <span>{faixa}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChoroplethUF = ({ experiencias = [], estadosSelecionados = [] }) => {
  const [geojsons, setGeojsons] = useState([]);
  const [dadosUF, setDadosUF] = useState({});
  const [mapaUFs, setMapaUFs] = useState({});
  const [quintilLimites, setQuintilLimites] = useState([]);
  const [regioesUF, setRegioesUF] = useState({});

  const centerBrasil = [-14.235, -51.9253];
  const zoomInicial = 4;

  useEffect(() => {
    const estados = Papa.parse(estadosCSV, {
      header: true,
      skipEmptyLines: true,
    }).data;

    const mapa = {};
    const regioes = {};
    estados.forEach((e) => {
      mapa[e.UF] = e.codigo_uf;
      regioes[e.codigo_uf] = e.regiao;
    });
    setMapaUFs(mapa);
    setRegioesUF(regioes);

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
      const regiao = regioesUF[codigo];
      return { UF: sigla, codigo_uf: codigo.toString(), total, regiao };
    });

    const totais = tabelaUF.map((d) => d.total);
    const quintis = [0.2, 0.4, 0.6, 0.8].map(p => {
      const idx = Math.floor(p * totais.length);
      return totais.sort((a, b) => a - b)[idx];
    });

    const limites = [0, ...quintis].map(v => Math.round(v / 5) * 5);
    setQuintilLimites(limites);

    const dadosComQuintil = {};
    tabelaUF.forEach(({ UF, codigo_uf, total, regiao }) => {
      let classe = 0;
      for (let i = 0; i < limites.length; i++) {
        if (total >= limites[i]) classe = i;
      }
      classe = Math.min(classe, coresQuintil.length - 1);
      dadosComQuintil[codigo_uf] = { UF, codigo_uf, total, regiao, quintil: classe };
    });

    setDadosUF(dadosComQuintil);
  }, [experiencias, mapaUFs, regioesUF]);

  return (
    <div style={{ width: '100%', height: '600px', marginBottom: '30px', position: 'relative' }}>
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
                  fillOpacity: 0.5,
                };
              }}
              onEachFeature={(feature, layer) => {
                const cod = feature.properties.codarea?.toString();
                const info = dadosUF?.[cod];
                if (info) {
                  layer.bindTooltip(`${info.UF}: ${info.total} experiências`, {
                    sticky: true,
                    direction: 'top',
                    offset: [0, -10],
                  });
                  layer.bindPopup(
                    `<strong>UF:</strong> ${info.UF}<br/><strong>Região:</strong> ${info.regiao}<br/><strong>Experiências:</strong> ${info.total}`
                  );
                }
              }}
            />
          );
        })}
      </MapContainer>
      <Legenda limites={quintilLimites} />
    </div>
  );
};

export default ChoroplethUF;
