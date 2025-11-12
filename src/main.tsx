import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import InfoPage from "./InfoPage.tsx";
import DataTablePage from "./DataTablePage.tsx";
import AnalysisPage from "./AnalysisPage.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} /> //done
        <Route path="/datatable" element={<DataTablePage />} /> //done
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/resources" element={<InfoPage />} />
      </Routes>
    </Router>
  </StrictMode>
);
