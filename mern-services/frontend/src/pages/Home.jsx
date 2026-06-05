import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { CATEGORIES, getCategoryMeta } from "../categories";

export default function Home() {
  const [services, setServices] = useState([]);
  const [activeCat, setActiveCat] = useState(null);       // null = show category cards
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch when category changes
  useEffect(() => {
    if (!activeCat) { setServices([]); return; }
    setLoading(true);
    setActiveSubCat(null);
    api.get(`/services?category=${encodeURIComponent(activeCat)}`)
      .then((r) => setServices(r.data))
      .catch(() => setError("Failed to load services."))
      .finally(() => setLoading(false));
  }, [activeCat]);

  const catMeta = activeCat ? getCategoryMeta(activeCat) : null;

  // Client-side filter + sort
  const filtered = useMemo(() => {
    let list = [...services];
    if (activeSubCat) list = list.filter((s) => s.subCategory === activeSubCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q)
      );
    }
    if (maxPrice) list = list.filter((s) => s.price <= Number(maxPrice));
    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sortBy === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [services, activeSubCat, search, maxPrice, sortBy]);

  const handleBack = () => {
    setActiveCat(null);
    setSearch("");
    setMaxPrice("");
    setSortBy("default");
    setActiveSubCat(null);
    setError("");
  };

  return (
    <div className="home-page">
      {/* ── EXACT MATCH BACKGROUND HERO SECTION WITH STATS BELT ── */}
      {!activeCat && (
        <div className="premium-hero-wrapper">
          {/* Main banner block with background picture */}
          <div className="premium-hero-main">
            <div className="premium-hero-content">
              <h1 className="premium-hero-title">
                FIND TRUSTED <br /> LOCAL SERVICES
              </h1>
              <p className="premium-hero-desc">
                BOOK VERIFIED PLUMBERS, ELECTRICIANS, CLEANERS & MORE – RIGHT AT YOUR DOORSTEP.
              </p>
              
              <div className="premium-hero-buttons">
                <button className="premium-btn-book" onClick={() => window.scrollTo({top: 550, behavior: 'smooth'})}>
                  Book Now
                </button>
                <button className="premium-btn-learn">
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Bottom stats belt layout underneath */}
          <div className="premium-hero-stats-belt">
            <div className="premium-stats-inner">
              <div className="premium-stat-box">
                <span className="premium-stat-num">500+</span>
                <span className="premium-stat-label">Providers</span>
              </div>
              <div className="premium-stat-box">
                <span className="premium-stat-num">10k+</span>
                <span className="premium-stat-label">Bookings</span>
              </div>
              <div className="premium-stat-box">
                <span className="premium-stat-num">7</span>
                <span className="premium-stat-label">Categories</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY GRID VIEW (no category selected) ── */}
      {!activeCat && (
        <div className="services-section">
          <div className="section-heading">
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-sub">Select a category to explore services and book instantly</p>
          </div>
          
          {/* Symmetrical Grid Layout Container */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
            gap: "24px",
            maxWidth: "1150px",
            margin: "0 auto",
            padding: "20px",
            width: "100%",
            boxSizing: "border-box"
          }}>
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.id} 
                className="category-card" 
                style={{ 
                  "--cat-color": cat.color, 
                  "--cat-bg": cat.bg,
                  margin: "0", 
                  width: "100%",
                  boxSizing: "border-box"
                }} 
                onClick={() => setActiveCat(cat.id)}
              >
                <div className="cat-card-icon">{cat.icon}</div>
                <div className="cat-card-name">{cat.label}</div>
                <div className="cat-card-count">{cat.subCategories.length} services</div>
                <div className="cat-card-arrow">→</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── SERVICES VIEW (category selected) ── */}
      {activeCat && (
        <div className="services-section">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <button className="breadcrumb-home" onClick={handleBack}>All Categories</button>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">{catMeta?.icon} {activeCat}</span>
          </div>

          {/* Category Banner */}
          <div className="cat-banner" style={{ "--cat-color": catMeta?.color, "--cat-bg": catMeta?.bg }}>
            <div className="cat-banner-icon">{catMeta?.icon}</div>
            <div>
              <h2 className="cat-banner-title">{catMeta?.label}</h2>
              <p className="cat-banner-sub">{services.length} services available</p>
            </div>
          </div>

          {/* Sub-category pills */}
          <div className="subcat-bar">
            <button
              className={`subcat-pill ${!activeSubCat ? "subcat-active" : ""}`}
              onClick={() => setActiveSubCat(null)}
              style={{ "--cat-color": catMeta?.color }}
            >
              All
            </button>
            {catMeta?.subCategories.map((sc) => (
              <button
                key={sc}
                className={`subcat-pill ${activeSubCat === sc ? "subcat-active" : ""}`}
                onClick={() => setActiveSubCat(sc === activeSubCat ? null : sc)}
                style={{ "--cat-color": catMeta?.color }}
              >
                {sc}
              </button>
            ))}
          </div>

          {/* Search + Filter bar */}
          <div className="filter-bar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder={`Search in ${activeCat}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
            </div>
            <div className="filter-controls">
              <div className="filter-item">
                <label className="filter-label">Max Price (₹)</label>
                <input
                  className="filter-input"
                  type="number"
                  min="0"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label className="filter-label">Sort by</label>
                <select className="filter-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="default">Default</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
              {(search || maxPrice || sortBy !== "default" || activeSubCat) && (
                <button className="filter-reset" onClick={() => { setSearch(""); setMaxPrice(""); setSortBy("default"); setActiveSubCat(null); }}>
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="results-meta">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {activeSubCat && <span className="results-filter"> · {activeSubCat}</span>}
            {search && <span className="results-filter"> · "{search}"</span>}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Services grid */}
          {loading ? (
            <div className="loading-grid">
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card" />)}
            </div>
          ) : (
            <div className="services-grid">
              {filtered.map((s) => (
                <div key={s._id} className="service-card" style={{ "--cat-color": catMeta?.color }}>
                  <div className="card-category-icon" style={{ fontSize: "2rem", padding: "1.25rem 1.25rem 0" }}>{catMeta?.icon}</div>
                  <div className="card-body">
                    <span className="card-badge">{s.subCategory || s.category}</span>
                    <h3 className="card-title">{s.title}</h3>
                    <p className="card-desc">{s.description || "Professional service at your doorstep."}</p>
                    <div className="card-meta">by {s.provider?.name}</div>
                  </div>
                  <div className="card-footer">
                    <span className="card-price">₹{s.price}</span>
                    <Link to={`/services/${s._id}`} className="card-link">Book Now →</Link>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && !loading && (
                <div className="empty-state">
                  <span className="empty-icon">🔍</span>
                  <p>No services found{activeSubCat ? ` for "${activeSubCat}"` : ""}.</p>
                  <button className="btn-outline" onClick={() => { setSearch(""); setMaxPrice(""); setSortBy("default"); setActiveSubCat(null); }}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}