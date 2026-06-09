import { CheckoutPanel } from "../components/CheckoutPanel";
import { MemberCard } from "../components/MemberCard";
import { RecentActivity } from "../components/RecentActivity";

export function CheckoutPage() {
  return (
    <main className="page checkout-page">
      <div className="page-heading">
        <h1>Checkout desk</h1>
      </div>
      <div className="checkout-layout">
        <div className="checkout-main">
          <CheckoutPanel />
          <RecentActivity />
        </div>
        <aside className="checkout-side">
          <MemberCard />
        </aside>
      </div>
    </main>
  );
}
