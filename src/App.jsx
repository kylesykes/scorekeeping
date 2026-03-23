import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./screens/Landing";
import Lobby from "./screens/Lobby";
import Game from "./screens/Game";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/:code" element={<Lobby />} />
        <Route path="/:code/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}
