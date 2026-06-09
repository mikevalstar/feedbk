import { RECENT_ACTIVITY } from "../data";

export function RecentActivity() {
  return (
    <section className="recent-activity" aria-label="Recent activity">
      <h2 className="section-title">🕓 Recent activity</h2>
      <ul className="activity-list">
        {RECENT_ACTIVITY.map((activity) => (
          <li key={activity.id} className="activity-item">
            <span className="activity-text">
              <strong>{activity.member}</strong> {activity.action} <em>{activity.book}</em>
            </span>
            <span className="activity-when">{activity.when}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
