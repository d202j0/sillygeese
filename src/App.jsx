import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Parents from './pages/Parents'
import PopCatchPage from './pages/games/PopCatchPage'
import MemoryFlipPage from './pages/games/MemoryFlipPage'
import PianoPage from './pages/games/PianoPage'
import SimpleSimonPage from './pages/games/SimpleSimonPage'

export default function App() {
  return (
    <Routes>
      <Route path="/"                   element={<Home />} />
      <Route path="/parents"            element={<Parents />} />
      <Route path="/play/pop"           element={<PopCatchPage />} />
      <Route path="/play/memory-flip"   element={<MemoryFlipPage />} />
      <Route path="/play/piano"         element={<PianoPage />} />
      <Route path="/play/simple-simon"  element={<SimpleSimonPage />} />
    </Routes>
  )
}
