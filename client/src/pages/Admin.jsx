import { useCallback, useEffect, useState } from "react";
import { adminLogin, fetchEnquiries } from "../api.js";
import Layout from "../components/Layout.jsx";

const TOKEN_KEY = "xtovia_admin_token";

function Login({ onLogin, notice }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { token } = await adminLogin(password);
      onLogin(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <main className="centered">
        <section className="card card-narrow">
          <span className="eyebrow">Team access</span>
          <h1>Admin Sign In</h1>
          <p className="subtitle">Enter the team password to view enquiries.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
            {(error || notice) && <div className="status failure">{error || notice}</div>}
          </form>
        </section>
      </main>
    </Layout>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const signOut = useCallback((message = "") => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setData(null);
    setNotice(message);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setData(await fetchEnquiries(token));
    } catch (err) {
      if (err.status === 401) signOut(err.message);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, signOut]);

  useEffect(() => {
    load();
  }, [load]);

  function handleLogin(newToken) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setNotice("");
    setToken(newToken);
  }

  if (!token) return <Login onLogin={handleLogin} notice={notice} />;

  const term = search.trim().toLowerCase();
  const enquiries = data?.enquiries ?? [];
  const visible = term
    ? enquiries.filter((enquiry) =>
        [enquiry.name, enquiry.phone, enquiry.purpose].some((text) =>
          text.toLowerCase().includes(term),
        ),
      )
    : enquiries;

  return (
    <Layout
      actions={
        <button type="button" className="secondary" onClick={() => signOut()}>
          Sign Out
        </button>
      }
    >
      <main className="admin">
        <div className="admin-header">
          <div>
            <span className="eyebrow">Admin panel</span>
            <h1>Bulk Order Enquiries</h1>
          </div>
          <button type="button" className="secondary" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && <div className="status failure">{error}</div>}

        {data && (
          <>
            <section className="stats">
              <div className="stat">
                <div className="stat-value">{data.stats.total.toLocaleString()}</div>
                <div className="stat-label">Total enquiries</div>
              </div>
              <div className="stat">
                <div className="stat-value">{data.stats.today.toLocaleString()}</div>
                <div className="stat-label">Received today</div>
              </div>
              <div className="stat">
                <div className="stat-value">{data.stats.totalQuantity.toLocaleString()}</div>
                <div className="stat-label">Total quantity requested</div>
              </div>
            </section>

            <section className="panel">
              <input
                type="search"
                className="search"
                placeholder="Search by name, phone or purpose"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {visible.length === 0 ? (
                <p className="empty">
                  {enquiries.length === 0 ? "No enquiries yet." : "No enquiries match your search."}
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Received</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th className="numeric">Quantity</th>
                        <th>Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((enquiry) => (
                        <tr key={enquiry._id}>
                          <td className="nowrap" data-label="Received">
                            {formatDate(enquiry.createdAt)}
                          </td>
                          <td data-label="Name">{enquiry.name}</td>
                          <td className="nowrap" data-label="Phone">
                            <a href={`tel:${enquiry.phone.replace(/[\s-]/g, "")}`}>
                              {enquiry.phone}
                            </a>
                          </td>
                          <td className="numeric" data-label="Quantity">
                            {enquiry.quantity.toLocaleString()}
                          </td>
                          <td className="purpose" data-label="Purpose">
                            {enquiry.purpose}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {!data && loading && <p className="empty">Loading enquiries...</p>}
      </main>
    </Layout>
  );
}
