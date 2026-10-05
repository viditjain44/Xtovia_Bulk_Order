import logo from "../assets/logo.png";

export default function Layout({ actions, children }) {
  return (
    <div className="shell">
      <div className="announcement">Bulk &amp; corporate orders</div>

      <header className="site-header">
        <a className="logo" href="https://xtovia.com" aria-label="Xtovia home">
          <img src={logo} alt="Xtovia" width="240" height="52" />
        </a>
        {actions && <div className="header-actions">{actions}</div>}
      </header>

      {children}

      <footer className="site-footer">
        © {new Date().getFullYear()} Xtovia · <a href="https://xtovia.com">xtovia.com</a>
      </footer>
    </div>
  );
}
