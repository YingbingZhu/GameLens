import { useAuth0 } from "@auth0/auth0-react";
import { Outlet, Link, useLocation } from "react-router-dom";
import "../style/appLayout.css";


export default function AppLayout() {
  const { logout, loginWithRedirect, user, isAuthenticated, isLoading} = useAuth0();
  const location = useLocation();

  return (
    <div className="app">
      <div className="title">
        <h1>GameLens</h1>
      </div>
      <div className="header-container">
        <nav className="menu">
          <ul className="menu-list">
            <li>
              <Link to="/debugger">Auth Debugger</Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link to="/profile">Profile</Link>
              </li>
            )}
            {location.pathname !== "/" && (
              <li>
                <Link to="/">Return to Reviews</Link>
              </li>
            )}
          </ul>
        </nav>
        <div>
          {isLoading ? (
            "Loading..."
          ) : isAuthenticated ? (
            <>
            <div className="welcome-container">
              <span><h1>Welcome 😊, {user.nickname}</h1></span>
              <button
                className="exit-button"
                onClick={() => logout({ returnTo: window.location.origin })}
              >
                LogOut
              </button>
              </div>
            </>
          ) : (
            <div>
            <button className="exit-button" onClick={() => loginWithRedirect({authorizationParams: {
                      screen_hint: "signup"
                    }})}
              style={{ marginRight: '10px' }}>
              Sign Up
            </button>
            <button className="exit-button" onClick={loginWithRedirect}>
              Log In
            </button>
          </div>
          )}
        </div>
      </div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}
