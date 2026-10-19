import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';

const features = [
  { icon: '🚘', label: 'Your car' },
  { icon: '🔧', label: 'Care' },
  { icon: '📋', label: 'History' },
  { icon: '💰', label: 'Fund' },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');

    try {
      const result = await apiRequest<{ url: string }>('/api/auth/google');
      window.location.assign(result.url);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to start Google sign-in.',
      );
      setGoogleLoading(false);
    }
  }

  return (
    <main style={styles.page} className="welcome-page">
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logo}>Λ</span>
          <span>AUTO CHRONICLE</span>
        </div>
      </header>

      <section style={styles.hero}>
        <p style={styles.eyebrow}>SMART VEHICLE MANAGEMENT</p>

        <h1 style={styles.heading}>
          Know your <span style={styles.accent}>car.</span>
          <br />
          Plan your <span style={styles.accent}>cash.</span>
        </h1>

        <p style={styles.description}>
          Your car's health, history and future costs—beautifully organised in
          one place.
        </p>
      </section>

      <section style={styles.vehicleSection}>
        <div style={styles.dashboardPreview} className="welcome-dashboard-grid">
          <div style={{ ...styles.dashboardCard, ...styles.healthCard }}>
            <p style={styles.cardLabel}>Vehicle Health</p>

            <div style={styles.healthContent}>
              <div style={styles.healthCircle}>
                <div style={styles.healthCircleInner}>
                  <strong>92%</strong>
                </div>
              </div>

              <div style={styles.healthDescription}>
                <strong>Excellent</strong>
                <span>Vehicle condition</span>
              </div>
            </div>

            <div style={styles.healthPulse}>
              {[8, 13, 9, 18, 24, 12, 17, 9, 14, 7, 12, 6].map(
                (height, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'block',
                      flex: 1,
                      maxWidth: '12px',
                      height: `${height}px`,
                      borderRadius: '4px',
                      background: '#43d4a5',
                    }}
                  />
                ),
              )}
            </div>
          </div>

          <div style={{ ...styles.dashboardCard, ...styles.expenseCard }}>
            <div style={styles.cardHeader}>
              <p style={styles.cardLabel}>Monthly Expenses</p>
              <strong style={styles.expenseTotal}>₦420,000</strong>
            </div>

            <div style={styles.expenseChart}>
              {[
                { month: 'M', height: '38%' },
                { month: 'T', height: '60%' },
                { month: 'W', height: '45%' },
                { month: 'T', height: '72%' },
                { month: 'F', height: '54%' },
                { month: 'S', height: '85%' },
                { month: 'S', height: '64%' },
                { month: 'M', height: '92%' },
              ].map((bar, index) => (
                <div key={index} style={styles.chartColumn}>
                  <div
                    style={{
                      ...styles.chartBar,
                      height: bar.height,
                      opacity: index === 7 ? 1 : 0.55,
                    }}
                  />

                  <span style={styles.chartLabel}>{bar.month}</span>
                </div>
              ))}
            </div>

            <p style={styles.cardFootnote}>
              Keep track of your vehicle spending
            </p>
          </div>

          <div style={{ ...styles.dashboardCard, ...styles.serviceCard }}>
            <div style={styles.serviceIcon}>▦</div>

            <div style={styles.serviceContent}>
              <p style={styles.cardLabel}>Next Service</p>
              <strong>In 2,500 km</strong>
              <span>Stay ahead of maintenance</span>
            </div>
          </div>

          <div style={{ ...styles.dashboardCard, ...styles.fundCard }}>
            <div style={styles.fundIcon}>🚨</div>

            <div style={styles.fundContent}>
              <p style={styles.cardLabel}>Emergency Fund</p>

              <strong>₦1,200 / ₦3,600</strong>

              <div style={styles.fundProgress}>
                <div style={styles.fundProgressFill} />
              </div>

              <span>33% of your goal</span>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.features} className="welcome-features">
        {features.map((feature, index) => (
          <div key={feature.label} style={styles.featureWrapper}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>{feature.icon}</div>
              <span>{feature.label}</span>
            </div>
            {index < features.length - 1 && (
              <div
                style={styles.featureConnector}
                className="welcome-feature-connector"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </section>

      <section style={styles.actions} className="welcome-actions">
        <button
          style={styles.primaryButton}
          onClick={() => navigate('/create-account')}
        >
          Get started <span>→</span>
        </button>

        <button
          style={styles.googleButton}
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            'Connecting...'
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => navigate('/login')}
        >
          I already have an account
        </button>
      </section>

      {error && (
        <p role="alert" style={styles.error}>
          {error}
        </p>
      )}

      <footer style={styles.footer}>
        ✓ Your vehicle data stays private and secure.
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#070d10',
    color: '#f7faf9',
    fontFamily: 'Arial, sans-serif',
    padding: '28px 5%',
    boxSizing: 'border-box',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontWeight: 700,
    letterSpacing: '2px',
    fontSize: 'clamp(14px, 3vw, 23px)',
  },

  logo: {
    fontSize: '35px',
    color: '#ffffff',
  },

  loginButton: {
    padding: '13px 24px',
    borderRadius: '30px',
    border: '1px solid #3c4649',
    background: 'transparent',
    color: '#ffffff',
    cursor: 'pointer',
  },

  googleButton: {
    padding: '20px',
    borderRadius: '18px',
    background: '#ffffff',
    color: '#202124',
    border: '1px solid #d5d8dc',
    fontSize: '17px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },

  hero: {
    textAlign: 'center',
    maxWidth: '720px',
    margin: '55px auto 30px',
  },

  eyebrow: {
    color: '#45d1a3',
    fontWeight: 700,
    letterSpacing: '3px',
  },

  heading: {
    fontSize: 'clamp(38px, 7vw, 68px)',
    lineHeight: 1.15,
    margin: '20px 0',
    fontWeight: 500,
  },

  accent: {
    color: '#45d1a3',
  },

  description: {
    color: '#aab5b8',
    fontSize: 'clamp(15px, 2.5vw, 21px)',
    lineHeight: 1.7,
  },

  vehicleSection: {
    minHeight: '320px',
    borderRadius: '20px',
    backgroundImage:
      "linear-gradient(90deg, rgba(5, 13, 16, 0.15), rgba(5, 13, 16, 0.8)), url('/images/hero-car.jpg')",
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box',
  },

  vehicleOverlay: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    width: '100%',
    maxWidth: '650px',
  },

  statCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '18px',
    background: 'rgba(5, 13, 16, 0.82)',
    border: '1px solid #30464b',
    borderRadius: '12px',
    color: '#d7e1e2',
    fontSize: '13px',
  },

  features: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    margin: '30px 0',
    flexWrap: 'wrap',
  },

  feature: {
    flex: '1 1 80px',
    minWidth: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    color: '#aab5b8',
    fontSize: '13px',
    position: 'relative',
    zIndex: '1',
  },

  featureIcon: {
    width: '58px',
    height: '58px',
    flexShrink: '0',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '17px',
    background: '#102a27',
    border: '1px solid #28564d',
    color: '#45d1a3',
    fontSize: '25px',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: '2',
  },

  featureWrapper: {
    flex: '1 1 0',
    minWidth: '0',
    display: 'flex',
    alignItems: 'flex-start',
    position: 'relative',
  },

  featureConnector: {
    height: '2px',
    background: '#39494b',
    top: '29px',
    left: 'calc(50% + 37px)',
    right: 'calc(-50% + 37px)',
    zIndex: '0',
    position: 'absolute',
  },

  actions: {
    display: 'grid',
    gap: '14px',
    maxWidth: '750px',
    margin: '35px auto 0',
  },

  primaryButton: {
    padding: '22px',
    borderRadius: '18px',
    background: '#45cba0',
    color: '#061512',
    border: 'none',
    fontSize: '20px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  secondaryButton: {
    padding: '20px',
    borderRadius: '18px',
    background: 'transparent',
    color: '#d3dcde',
    border: '1px solid #344246',
    fontSize: '17px',
    cursor: 'pointer',
  },

  footer: {
    textAlign: 'center',
    color: '#8a999d',
    marginTop: '30px',
    fontSize: '13px',
  },

  error: {
    color: '#ff9d91',
    textAlign: 'center',
    marginTop: '16px',
  },

  dashboardPreview: {
    width: '100%',
    maxWidth: '780px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
    alignItems: 'stretch',
  },

  dashboardCard: {
    position: 'relative',
    minWidth: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    padding: '18px',
    borderRadius: '15px',
    background: 'rgba(7, 15, 19, 0.91)',
    border: '1px solid rgba(87, 139, 147, 0.32)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
    color: '#f4faf9',
  },

  healthCard: {
    minHeight: '180px',
  },

  expenseCard: {
    minHeight: '180px',
  },

  serviceCard: {
    minHeight: '110px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },

  fundCard: {
    minHeight: '110px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },

  cardLabel: {
    margin: '0 0 14px',
    color: '#c0cecf',
    fontSize: '12px',
    fontWeight: 500,
  },

  healthContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },

  healthCircle: {
    width: '76px',
    height: '76px',
    flexShrink: 0,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: 'conic-gradient(#43d4a5 0deg 331deg, #263b3e 331deg 360deg)',
    boxShadow: '0 0 18px rgba(67, 212, 165, 0.12)',
  },

  healthCircleInner: {
    width: '61px',
    height: '61px',
    borderRadius: '50%',
    background: '#101c20',
    display: 'grid',
    placeItems: 'center',
    color: '#f5fffb',
    fontSize: '16px',
  },

  healthDescription: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
  },

  healthDescriptionSmall: {
    color: '#a7b8b9',
    fontSize: '11px',
  },

  healthPulse: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: '25px',
    marginTop: '13px',
    opacity: 0.8,
  },

  expenseTotal: {
    color: '#f1faf8',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },

  expenseChart: {
    height: '72px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '7px',
    borderBottom: '1px solid #34464a',
  },

  chartColumn: {
    height: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '5px',
    minWidth: 0,
  },

  chartBar: {
    width: '100%',
    maxWidth: '23px',
    minHeight: '8px',
    borderRadius: '4px 4px 0 0',
    background: '#43cda5',
    boxShadow: '0 0 10px rgba(67, 205, 165, 0.08)',
  },

  chartLabel: {
    fontSize: '9px',
    color: '#91a4a6',
    paddingBottom: '3px',
  },

  cardFootnote: {
    fontSize: '10px',
    color: '#94a8aa',
    margin: '10px 0 0',
  },

  serviceIcon: {
    width: '45px',
    height: '45px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '12px',
    background: '#132d3a',
    border: '1px solid #2b5263',
    color: '#8fd3f0',
    fontSize: '26px',
  },

  serviceContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
  },

  fundIcon: {
    width: '45px',
    height: '45px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '12px',
    background: '#322d19',
    border: '1px solid #6e6031',
    color: '#f1d16b',
    fontSize: '28px',
  },

  fundContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    flex: 1,
    minWidth: 0,
  },

  fundProgress: {
    width: '100%',
    height: '6px',
    background: '#34413b',
    borderRadius: '20px',
    overflow: 'hidden',
  },

  fundProgressFill: {
    width: '33.333%',
    height: '100%',
    background: '#e6c85e',
    borderRadius: '20px',
  },
};

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 48 48"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.5 19.5 0 0 0 24 4 20 20 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"
      />
    </svg>
  );
}
