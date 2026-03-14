import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import PumpMechanismPage from "./pages/PumpMechanismPage";
import NeuronZapPage from "./pages/NeuronZapPage";
import OscillationAuraPage from "./pages/OscillationAuraPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/pump-mechanism" replace />} />
          <Route path="/pump-mechanism" element={<PumpMechanismPage />} />
          <Route path="/neuron-zap" element={<NeuronZapPage />} />
          <Route path="/oscillation-aura" element={<OscillationAuraPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
