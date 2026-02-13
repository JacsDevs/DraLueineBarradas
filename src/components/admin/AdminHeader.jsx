import { FaRegCalendarAlt, FaRegClock, FaRegEdit, FaRegFileAlt } from "react-icons/fa";

const iconByStat = {
  posts: FaRegFileAlt,
  drafts: FaRegEdit,
  month: FaRegCalendarAlt,
  latest: FaRegClock
};

export default function AdminHeader({ stats }) {
  return (
    <header className="admin-header">
      <div className="admin-header-main">
        <div className="admin-intro">
          <span className="admin-chip">Painel administrativo</span>
          <h1>Dashboard de Conteúdo</h1>
          <p>Gerencie publicações, acompanhe indicadores e mantenha seu perfil atualizado.</p>
        </div>
      </div>

      <div className="admin-stats-grid admin-stats-grid-full">
        {stats?.map((item) => {
          const Icon = iconByStat[item.icon] || FaRegFileAlt;

          return (
            <article key={item.label} className="admin-stat-card">
              <span className="admin-stat-label">
                <Icon aria-hidden="true" />
                {item.label}
              </span>
              <strong className="admin-stat-value">{item.value}</strong>
              <small className="admin-stat-note">{item.note}</small>
            </article>
          );
        })}
      </div>
    </header>
  );
}
