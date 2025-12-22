import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Doux from './components/Doux';
import Tools from './components/elements/Tools/Tools';
import Pedantle from './components/elements/Tools/pedantle/Pedantle';
import Map from './components/elements/Tools/mapper/Map';

function App() {
  return (
    <Router basename="/Jordan/">
      <Routes>
        <Route path="/" element={<Doux />} />

        <Route path="/Tools" element={<Tools />} />
        <Route path="/Tools/Pedantle" element={<Pedantle />} />
        <Route path="/Tools/Map" element={<Map />} />
      </Routes>
    </Router>
  );
}

export default App;