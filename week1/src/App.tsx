import { HashRouter, Route, Routes } from 'react-router-dom';
import PageShell from './components/layout/PageShell';
import TripListPage from './pages/TripList';
import TripDetailPage from './pages/TripDetail';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<PageShell />}>
          <Route path="/" element={<TripListPage />} />
          <Route path="/trip/:id" element={<TripDetailPage />} />
          <Route path="*" element={<TripListPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
