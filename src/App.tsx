import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Doux from './components/Doux';

function App() {
  return (
    <Router basename="/Jordan/">
      <Routes>
        <Route path="/" element={<Doux />} />
      </Routes>
    </Router>
  );
}

export default App;