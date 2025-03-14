import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Paginas/Login'
import PaginaCliente from './Paginas/PaginaCliente';
import Tienda from './Paginas/Tienda';
import DetallesJardin from './Paginas/DetallesJardin';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import 'bootswatch/dist/solar/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import './App.css'

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="full-background">
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/PaginaCliente" element={<PaginaCliente />} />
        <Route path="/Tienda" element={<Tienda />} />
        <Route path="/DetallesJardin/:id" element={<DetallesJardin />} />
      </Routes>
    </Router>
    </div>
  );
}

export default App
