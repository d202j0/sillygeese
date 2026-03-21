import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Parents from './pages/Parents'
import PopPurple from './pages/games/PopPurple'
import PopBlue from './pages/games/PopBlue'

export default function App() {
  return (
    <Routes>
      <Route path="/"                element={<Home />} />
      <Route path="/parents"         element={<Parents />} />
      <Route path="/play/pop-purple" element={<PopPurple />} />
      <Route path="/play/pop-blue"   element={<PopBlue />} />
    </Routes>
  )
}
