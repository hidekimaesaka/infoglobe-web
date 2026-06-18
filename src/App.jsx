import { useEffect, useRef, useState } from 'react';
import countryNames from './countryNames';

const API_URL = import.meta.env.VITE_API_URL || 'https://infoglobe-api.onrender.com';

function normalizeCountryName(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const countryLookup = new Map(
  countryNames.map((countryName) => [normalizeCountryName(countryName), countryName]),
);

function formatNumber(value) {
  if (value == null) {
    return 'Unknown';
  }

  return new Intl.NumberFormat('en-US').format(value);
}

function formatArea(value) {
  if (value == null) {
    return 'Unknown';
  }

  return `${formatNumber(value)} km²`;
}

function joinOrFallback(values, separator, fallback = 'Unknown') {
  return values.length ? values.join(separator) : fallback;
}

export default function App() {
  const abortRef = useRef(null);
  const lastRequestedCountryRef = useRef('');
  const [searchValue, setSearchValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countryInfo, setCountryInfo] = useState(null);

  const normalizedSearchValue = normalizeCountryName(searchValue);
  const suggestions = normalizedSearchValue
    ? countryNames
        .filter((countryName) =>
          normalizeCountryName(countryName).includes(normalizedSearchValue),
        )
        .slice(0, 8)
    : countryNames.slice(0, 8);

  const pais = countryInfo?.pais || 'No country selected';
  const bandeira = countryInfo?.bandeira || '';
  const capital = countryInfo?.capital || [];
  const idiomas = countryInfo?.idiomas || [];
  const moedas = countryInfo?.moedas || [];
  const populacao = countryInfo?.populacao ?? null;
  const fronteiras = countryInfo?.fronteiras || [];
  const area = countryInfo?.area ?? null;
  const presidenteAtual = countryInfo?.presidente_atual || 'Unknown';
  const imagemPresidente = countryInfo?.imagem_presidente || '';
  const personalidades = countryInfo?.personalidades || [];
  const cultura = countryInfo?.cultura || '';
  const empresas = countryInfo?.empresas || [];
  const tipoDeGoverno = countryInfo?.tipo_de_governo || 'Unknown';

  async function fetchCountryInfo(countryName) {
    if (!API_URL) {
      setErrorMessage('VITE_API_URL is not configured.');
      return;
    }

    if (lastRequestedCountryRef.current === countryName && countryInfo?.pais === countryName) {
      return;
    }

    abortRef.current?.abort();

    const abortController = new AbortController();
    abortRef.current = abortController;
    lastRequestedCountryRef.current = countryName;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/country-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country_name: countryName }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      setCountryInfo(payload);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }

      setErrorMessage('Unable to retrieve the dossier for this country.');
      lastRequestedCountryRef.current = '';
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function commitCountry(countryName) {
    setSearchValue(countryName);
    setActiveIndex(-1);
    setIsSuggestionsOpen(false);
    fetchCountryInfo(countryName);
  }

  function submitSearch() {
    const exactMatch = countryLookup.get(normalizeCountryName(searchValue));

    if (!exactMatch) {
      setErrorMessage('Select a valid country from the autocomplete list.');
      return;
    }

    commitCountry(exactMatch);
  }

  function handleSearchChange(event) {
    setSearchValue(event.target.value);
    setActiveIndex(-1);
    setIsSuggestionsOpen(true);
    setErrorMessage('');
  }

  function handleSearchFocus() {
    setIsSuggestionsOpen(true);
  }

  function handleSearchBlur() {
    window.setTimeout(() => {
      setIsSuggestionsOpen(false);
    }, 120);
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsSuggestionsOpen(true);
      setActiveIndex((currentIndex) =>
        currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0,
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsSuggestionsOpen(true);
      setActiveIndex((currentIndex) =>
        currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1,
      );
      return;
    }

    if (event.key === 'Enter') {
      const highlightedCountry = suggestions[activeIndex];
      const exactMatch = countryLookup.get(normalizeCountryName(searchValue));

      if (highlightedCountry) {
        event.preventDefault();
        commitCountry(highlightedCountry);
        return;
      }

      if (exactMatch) {
        event.preventDefault();
        commitCountry(exactMatch);
        return;
      }

      setErrorMessage('Select a valid country from the autocomplete list.');
      return;
    }

    if (event.key === 'Escape') {
      setIsSuggestionsOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    submitSearch();
  }

  return (
    <main className="app-shell">
      <div className="ambient-grid" />
      <div className="ambient-glow ambient-glow-left" />
      <div className="ambient-glow ambient-glow-right" />

      <section className={isLoading ? 'dossier-card is-loading' : 'dossier-card'} aria-busy={isLoading}>
        <header className="dossier-header">
          <div className="title-cluster">
            <span className="eyebrow">Infoglobe Directorate</span>
            <h1>Field Intelligence Console</h1>
            <p>
              Centralize geopolitical signals, leadership snapshots and strategic indicators inside
              a single classified dossier.
            </p>
          </div>

          <div className="header-meta">
            <div className="status-pill">
              <span className="status-dot" />
              {isLoading ? 'Decrypting feed' : countryInfo ? 'Active dossier' : 'Awaiting target'}
            </div>
            <div className="clearance-chip">Clearance: Umbra-7</div>
          </div>
        </header>

        <div className="command-bar">
          <form className="search-shell" onSubmit={handleSearchSubmit}>
            <label htmlFor="country-search">Target country</label>
            <div className="search-stack">
              <div className="search-row">
                <input
                  id="country-search"
                  type="text"
                  value={searchValue}
                  placeholder="Type a country to open the file"
                  autoComplete="off"
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  onKeyDown={handleSearchKeyDown}
                  aria-autocomplete="list"
                  aria-expanded={isSuggestionsOpen}
                  aria-controls="country-suggestions"
                />
                <button className="search-button" type="submit">
                  Run query
                </button>
              </div>

              {isSuggestionsOpen && suggestions.length > 0 ? (
                <div className="autocomplete-panel" id="country-suggestions">
                  {suggestions.map((countryName, index) => (
                    <button
                      key={countryName}
                      type="button"
                      className={
                        index === activeIndex
                          ? 'autocomplete-option is-active'
                          : 'autocomplete-option'
                      }
                      onMouseDown={() => commitCountry(countryName)}
                    >
                      {countryName}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </form>

          <div className="quick-actions">
            <button type="button" className="ghost-button" onClick={() => commitCountry('Brazil')}>
              Brazil
            </button>
            <button type="button" className="ghost-button" onClick={() => commitCountry('Japan')}>
              Japan
            </button>
            <button type="button" className="ghost-button" onClick={() => commitCountry('Canada')}>
              Canada
            </button>
          </div>
        </div>

        <div className="feedback-row">
          <span className="feedback-label">Signal</span>
          <p className="search-feedback">
            {errorMessage ||
              (isLoading
                ? 'Decrypting live dossier...'
                : countryInfo
                  ? 'Dossier synchronized.'
                  : 'Select a country to begin the intelligence sweep.')}
          </p>
        </div>

        <div className="dossier-body">
          <section className="hero-column">
            <div className="profile-band">
              {bandeira ? (
                <img className="flag-mark" src={bandeira} alt={`Flag of ${pais}`} />
              ) : (
                <div className="flag-mark flag-placeholder" aria-hidden="true">
                  No flag
                </div>
              )}

              <div className="headline-copy">
                <span className="section-label">Primary target</span>
                <h2>{pais}</h2>
                <p>{tipoDeGoverno}</p>
              </div>
            </div>

            <p className="hero-summary">
              {countryInfo
                ? cultura || 'No cultural brief available.'
                : 'A covert summary will appear here after you open a country file.'}
            </p>

            <div className="metrics-grid">
              <article className="metric-card">
                <span className="metric-label">Population</span>
                <strong>{formatNumber(populacao)}</strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Area</span>
                <strong>{formatArea(area)}</strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Borders</span>
                <strong>{fronteiras.length ? fronteiras.length : 'None'}</strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Capital</span>
                <strong>{joinOrFallback(capital, ', ')}</strong>
              </article>
            </div>

            <div className="intel-panels">
              <article className="intel-panel">
                <span className="section-label">Identity slate</span>
                <dl className="info-list">
                  <div>
                    <dt>Capital</dt>
                    <dd>{joinOrFallback(capital, ', ')}</dd>
                  </div>
                  <div>
                    <dt>Languages</dt>
                    <dd>{joinOrFallback(idiomas, ' / ')}</dd>
                  </div>
                  <div>
                    <dt>Government</dt>
                    <dd>{tipoDeGoverno}</dd>
                  </div>
                  <div>
                    <dt>Frontiers</dt>
                    <dd>{fronteiras.length ? fronteiras.join(', ') : 'None'}</dd>
                  </div>
                </dl>
              </article>

              <article className="intel-panel">
                <span className="section-label">Currency desk</span>
                <div className="currency-stack">
                  {moedas.length ? (
                    moedas.map((moeda) => (
                      <div className="currency-card" key={`${moeda.codigo}-${moeda.nome}`}>
                        <strong>{moeda.codigo || 'N/A'}</strong>
                        <span>{moeda.nome || 'Unknown currency'}</span>
                        <em>{moeda.simbolo || 'N/A'}</em>
                      </div>
                    ))
                  ) : (
                    <div className="currency-card">
                      <strong>N/A</strong>
                      <span>No currency data</span>
                      <em>N/A</em>
                    </div>
                  )}
                </div>
              </article>
            </div>
          </section>

          <aside className="sidebar-column">
            <article className="portrait-panel">
              <span className="section-label">Current leadership</span>
              <div className="portrait-frame">
                {imagemPresidente ? (
                  <img src={imagemPresidente} alt={presidenteAtual} />
                ) : (
                  <div className="portrait-placeholder">No image</div>
                )}
              </div>
              <strong>{presidenteAtual}</strong>
            </article>

            <article className="intel-panel compact-panel">
              <span className="section-label">Notable figures</span>
              <ul className="tag-list">
                {personalidades.length ? (
                  personalidades.map((nome) => <li key={nome}>{nome}</li>)
                ) : (
                  <li>No figures available</li>
                )}
              </ul>
            </article>

            <article className="intel-panel compact-panel">
              <span className="section-label">Strategic companies</span>
              <ul className="tag-list">
                {empresas.length ? (
                  empresas.map((empresa) => <li key={empresa}>{empresa}</li>)
                ) : (
                  <li>No companies available</li>
                )}
              </ul>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
