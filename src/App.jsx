import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import estadosCSV from './data/estados.csv?raw';
import CustomMultiSelect from './components/CustomMultiSelect';
import MapaBrasil from './components/MapaBrasil';

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
      // outros filtros, se quiser, podem ir aqui
    };
  }, []);

  const [valoresSelecionados, setValoresSelecionados] = useState({});

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
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

      {/* Conteúdo principal */}
      <main style={{ flex: 1, padding: '40px' }}>
        <h1>Mapa Interativo</h1>
        <MapaBrasil
          estadosVisiveis={
            valoresSelecionados.estado?.includes('__all__')
              ? filtros.estado.map((e) => e.value)
              : valoresSelecionados.estado || []
          }
        />


        <h1>Valores Selecionados</h1>
        <pre
          style={{
            backgroundColor: '#eee',
            padding: '20px',
            borderRadius: '8px',
            fontSize: '16px',
          }}
        >
          {JSON.stringify(valoresSelecionados, null, 2)}
        </pre>
      </main>
    </div>
  );
}

export default App;
