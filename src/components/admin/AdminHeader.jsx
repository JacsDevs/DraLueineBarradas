export default function AdminHeader({ stats }) {
  return (
    <header className="admin-header">
      <div className="admin-header-main">
        <div className="admin-intro">
          <span className="admin-chip">Painel administrativo</span>
          <h1>Dashboard de Conteudo</h1>
          <p>Gerencie publicacoes, acompanhe indicadores e mantenha seu perfil atualizado.</p>
        </div>
      </div>

      <div className="admin-stats-grid admin-stats-grid-full">
        {stats?.map((item) => (
          <article key={item.label} className="admin-stat-card">
            <span className="admin-stat-label">{item.label}</span>
            <strong className="admin-stat-value">{item.value}</strong>
            <small className="admin-stat-note">{item.note}</small>
          </article>
        ))}
      </div>
    </header>
  );
}
