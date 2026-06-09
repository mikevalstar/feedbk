import { MEMBER } from "../data";

export function MemberCard() {
  return (
    <section className="member-card" aria-label="Member card">
      <div className="member-top">
        <span className="member-avatar">🦉</span>
        <div>
          <div className="member-name">{MEMBER.name}</div>
          <div className="member-card-number">{MEMBER.cardNumber}</div>
        </div>
      </div>
      <dl className="member-stats">
        <div>
          <dt>Member since</dt>
          <dd>{MEMBER.memberSince}</dd>
        </div>
        <div>
          <dt>Books out</dt>
          <dd>{MEMBER.booksOut}</dd>
        </div>
        <div>
          <dt>Holds</dt>
          <dd>{MEMBER.holds}</dd>
        </div>
        <div>
          <dt>Fines</dt>
          <dd>{MEMBER.fines}</dd>
        </div>
      </dl>
    </section>
  );
}
