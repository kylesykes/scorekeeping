import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Landing from "./screens/Landing";
import Game from "./screens/Game";

function LobbyRedirect() {
  const { code } = useParams();
  return <Navigate to={`/${code}/game`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/:code" element={<LobbyRedirect />} />
        <Route path="/:code/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}
