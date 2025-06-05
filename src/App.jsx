import React, { useEffect, useState, useMemo } from 'react';
import CustomMultiSelect from './components/CustomMultiSelect';

function App() {
  const filtros = useMemo(() => ({
    frutas: [
      { value: 'banana', label: 'Banana' },
      { value: 'maçã', label: 'Maçã' },
      { value: 'laranja', label: 'Laranja' },
      { value: 'abacaxi', label: 'Abacaxi' },
    ],
    cores: [
      { value: 'azul', label: 'Azul' },
      { value: 'vermelho', label: 'Vermelho' },
      { value: 'verde', label: 'Verde' },
      { value: 'amarelo', label: 'Amarelo' },
    ],
    animais: [
      { value: 'gato', label: 'Gato' },
      { value: 'cachorro', label: 'Cachorro' },
      { value: 'leão', label: 'Leão' },
      { value: 'tigre', label: 'Tigre' },
    ],
    paises: [
      { value: 'brasil', label: 'Brasil' },
      { value: 'argentina', label: 'Argentina' },
      { value: 'alemanha', label: 'Alemanha' },
      { value: 'japão', label: 'Japão' },
    ],
  }), []);

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

    atualizarValores(); // valor inicial

    const interval = setInterval(atualizarValores, 500); // atualiza a cada 500ms

    return () => clearInterval(interval);
  }, [filtros]);

  const labels = {
    frutas: 'Frutas (pode criar)',
    cores: 'Cores favoritas',
    animais: 'Animais preferidos',
    paises: 'Países visitados',
  };

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
              {labels[chave] || chave[0].toUpperCase() + chave.slice(1)}
            </label>
            <CustomMultiSelect
              options={opcoes}
              allowCreate={chave === 'frutas'}
              queryKey={chave}
            />
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
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
