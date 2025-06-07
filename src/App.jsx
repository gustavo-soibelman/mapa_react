import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import estadosCSV from './data/estados.csv?raw';
import CustomMultiSelect from './components/CustomMultiSelect';
import ChoroplethUF from './components/ChoroplethUF';
import experienciasCSV from './data/experiencias_selecionadas_mapa.csv?raw';

function App() {
  const filtros = useMemo(() => {
    const parsed = Papa.parse(estadosCSV, {
      header: true,
      skipEmptyLines: true,
    }).data;

    return {
      estado: parsed.map((e) => ({
        label: e.UF,
        value: e.codigo_uf,
      })),
    };
  }, []);

  const [valoresSelecionados, setValoresSelecionados] = useState({});
  const [dadosExperiencias, setDadosExperiencias] = useState([]);

  useEffect(() => {
    const atualizarValores = () => {
      const params = new URLSearchParams(window.location.search);
      const novosValores = {};

      for (const key of Object.keys(filtros)) {
        const raw = params.get(key);
        novosValores[key] = raw
          ? raw.split('+').map((val) => decodeURIComponent(val))
          : [];
      }

      setValoresSelecionados(novosValores);
    };

    atualizarValores();
    const interval = setInterval(atualizarValores, 500);
    return () => clearInterval(interval);
  }, [filtros]);

  useEffect(() => {
    const parsed = Papa.parse(experienciasCSV, {
      header: true,
      skipEmptyLines: true,
    }).data;

    setDadosExperiencias(parsed);
  }, []);

  const estadosFiltrados = useMemo(() => {
    if (valoresSelecionados.estado?.includes('__all__')) {
      return filtros.estado.map((e) => e.value);
    }
    return valoresSelecionados.estado || [];
  }, [valoresSelecionados, filtros]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <aside
        style={{
          width: '300px',
          padding: '20px',
          backgroundColor: '#f2f2f2',
          borderRight: '1px solid #ccc',
        }}
      >
        <h2>Filtros</h2>
        {Object.entries(filtros).map(([chave, opcoes]) => (
          <div key={chave} style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold' }}>
              {chave[0].toUpperCase() + chave.slice(1)}
            </label>
            <CustomMultiSelect
              options={opcoes}
              allowCreate={false}
              queryKey={chave}
            />
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <h1>Mapa Coroplético por UF</h1>
        <ChoroplethUF
          experiencias={dadosExperiencias}
          estadosSelecionados={estadosFiltrados}
        />
      </main>
    </div>
  );
}

export default App;
