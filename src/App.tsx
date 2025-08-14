import React, { useState, useEffect } from 'react';

function App() {
  const [counter, setCounter] = useState<number>(0);

  useEffect(() => {
    const loadCounter = async () => {
      if (window.electronAPI) {
        const currentCounter = await window.electronAPI.getCounter();
        setCounter(currentCounter);
      }
    };
    loadCounter();
  }, []);

  const handleIncrement = async () => {
    if (window.electronAPI) {
      const newCounter = await window.electronAPI.incrementCounter();
      setCounter(newCounter);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Hello, World!</h1>
      <div style={{ marginTop: '20px' }}>
        <p>Server-side counter: {counter}</p>
        <button 
          onClick={handleIncrement}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Increment Counter
        </button>
      </div>
    </div>
  );
}

export default App;