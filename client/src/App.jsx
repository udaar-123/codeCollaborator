import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/Shared/ProtectedRoute.jsx";
import { lazy, Suspense } from "react";
import Landing from "./pages/Landing.jsx";

const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const EditorRoom = lazy(() => import("./pages/EditorRoom.jsx"));
const SessionReplay = lazy(() => import("./pages/SessionReplay.jsx"));

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Suspense
            fallback={
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100vh",
                  background: "#0d1117",
                  color: "#fff",
                }}
              >
                Loading...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />}></Route>
              <Route path="/login" element={<Login />}></Route>
              <Route path="/register" element={<Register />}></Route>

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              ></Route>

              <Route
                path="/room/:roomId"
                element={
                  <ProtectedRoute>
                    <EditorRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/session/:sessionId"
                element={
                  <ProtectedRoute>
                    <SessionReplay />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Landing />}></Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </>
  );
}
export default App;
