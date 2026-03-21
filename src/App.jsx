import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Parents from './pages/Parents'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/parents" element={<Parents />} />
    </Routes>
  )
}
