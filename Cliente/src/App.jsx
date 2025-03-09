import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Paginas/Login'
import PaginaCliente from './Paginas/PaginaCliente';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import 'bootswatch/dist/solar/bootstrap.min.css';
import './App.css'

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="full-background">
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/nextpage" element={<PaginaCliente />} />
      </Routes>
    </Router>
    </div>
  );
}

export default App
