import { NavLink, Route, Routes } from "react-router-dom";
import DatePage from "./pages/DatePage";
import Home from "./pages/Home";
import Log from "./pages/Log";
import MoveDetail from "./pages/MoveDetail";
import MoveSummary from "./pages/MoveSummary";
import PartnerDetail from "./pages/PartnerDetail";
import Partners from "./pages/Partners";
import RollDetail from "./pages/RollDetail";
import RollSummary from "./pages/RollSummary";
import SessionDetail from "./pages/SessionDetail";
import SessionList from "./pages/SessionList";
import { EXAMPLE_MODE } from "./store";

export default function App() {
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
      {EXAMPLE_MODE && (
        <div className="example-banner">
          Example site with six months of demo data — edits stay in your
          browser.{" "}
          <a href="https://github.com/abstractionjackson/bjj-journal">
            Get the code
          </a>{" "}
          to keep your own journal.
        </div>
      )}
      <main className="container">
        <nav className="site-nav">
          <ul>
            <li>
              <NavLink to="/" className="brand">
                <strong>BJJ Journal</strong>
              </NavLink>
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
            <li>
              <NavLink to="/partners">Partners</NavLink>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/log" element={<Log />} />
          <Route path="/sessions" element={<SessionList />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/dates/:date" element={<DatePage />} />
          <Route path="/moves" element={<MoveSummary />} />
          <Route path="/moves/:name" element={<MoveDetail />} />
          <Route path="/rolls" element={<RollSummary />} />
          <Route path="/rolls/:sessionId/:rollId" element={<RollDetail />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/partners/:name" element={<PartnerDetail />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
