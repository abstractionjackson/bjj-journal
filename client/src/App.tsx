import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { getCredentials } from "./api";
import Login from "./components/Login";
import Home from "./pages/Home";
import Log from "./pages/Log";
import MoveDetail from "./pages/MoveDetail";
import MoveSummary from "./pages/MoveSummary";
import PartnerDetail from "./pages/PartnerDetail";
import RollDetail from "./pages/RollDetail";
import RollSummary from "./pages/RollSummary";
import SessionDetail from "./pages/SessionDetail";
import SessionList from "./pages/SessionList";

export default function App() {
  const [authed, setAuthed] = useState<boolean>(() => getCredentials() !== null);

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return (
    <>
      <div className="belt" aria-hidden="true">
        <div className="rank-bar">
          <span className="stripe" />
          <span className="stripe" />
          <span className="stripe" />
          <span className="stripe" />
        </div>
      </div>
      <main className="container">
        <nav className="site-nav">
          <ul>
            <li>
              <strong>BJJ Journal</strong>
            </li>
          </ul>
          <ul>
            <li>
              <NavLink to="/">Home</NavLink>
            </li>
            <li>
              <NavLink to="/log">Log</NavLink>
            </li>
            <li>
              <NavLink to="/moves">Moves</NavLink>
            </li>
            <li>
              <NavLink to="/rolls">Rolls</NavLink>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/log" element={<Log />} />
          <Route path="/sessions" element={<SessionList />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/moves" element={<MoveSummary />} />
          <Route path="/moves/:name" element={<MoveDetail />} />
          <Route path="/rolls" element={<RollSummary />} />
          <Route path="/rolls/:sessionId/:rollId" element={<RollDetail />} />
          <Route path="/partners/:name" element={<PartnerDetail />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
