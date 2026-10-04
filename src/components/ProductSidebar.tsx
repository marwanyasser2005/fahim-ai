import { Link, NavLink } from "react-router-dom";
import { BadgeCheck, Headphones, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileRole } from "@/hooks/useProfileRole";
import { hint, label, productNav } from "@/lib/appNavigation";
import FahimBrand from "@/components/brand/FahimBrand";
import { OPEN_JUDGE_MODE } from "@/config/productMode";

export default function ProductSidebar({
  language,
}: {
  language: "ar" | "en";
}) {
  const { user, signOut } = useAuth();
  const { isStaff, isAdmin } = useProfileRole();
  const ar = language === "ar";
  if (!user) return null;
  const items = productNav.filter((entry) => entry.role === "all" || isStaff);
  return (
    <aside className="product-sidebar">
      <Link className="sidebar-brand" to="/dashboard">
        <FahimBrand language={language} />
      </Link>
      <p className="os-eyebrow">
        {ar ? "مساحتك للتعلّم" : "Your learning space"}
      </p>
      <nav aria-label={ar ? "التنقل داخل المنصة" : "Workspace navigation"}>
        {items.map((entry) => (
          <NavLink
            key={entry.to}
            to={entry.to}
            title={hint(entry, language)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""} ${entry.to === "/ask-fahim" ? "sidebar-ai" : ""}`
            }
          >
            <entry.icon size={19} />
            {label(entry, language)}
          </NavLink>
        ))}
        {isStaff && (
          <NavLink to="/teacher" className="sidebar-link" title={ar ? "فصولك وقياس الأثر" : "Classes and impact"}>
            {(() => {
              const Entry = productNav.find((item) => item.to === "/teacher")!;
              return <Entry.icon size={19} />;
            })()}
            {ar ? "غرفة المعلم" : "Teacher room"}
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin" className="sidebar-link" title={ar ? "لوحة الإدارة" : "Admin console"}>
            <Settings size={19} />
            {ar ? "الإدارة" : "Admin"}
          </NavLink>
        )}
      </nav>
      <footer>
        <Link to="/support" className="sidebar-link">
          <Headphones size={18} />
          {ar ? "المساعدة" : "Support"}
        </Link>
        {OPEN_JUDGE_MODE ? (
          <Link to="/certificates" className="sidebar-link">
            <BadgeCheck size={18} />
            {ar ? "شهاداتي وأدلتي" : "Credentials & evidence"}
          </Link>
        ) : <Link to="/profile" className="sidebar-link">
          <Settings size={18} />
          {ar ? "الحساب والإعدادات" : "Account & settings"}
        </Link>}
        {!OPEN_JUDGE_MODE && <div className="sidebar-account">
          <span>
            {String(user.user_metadata?.full_name || user.email || "F").slice(
              0,
              1,
            )}
          </span>
          <div>
            <strong>{user.user_metadata?.full_name || user.email}</strong>
            <small>{ar ? "حساب فَهيم" : "Fahim account"}</small>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label={ar ? "تسجيل الخروج" : "Sign out"}
          >
            <LogOut size={18} />
          </button>
        </div>}
        {OPEN_JUDGE_MODE && <div className="sidebar-account" title={ar ? "جلسة مجهولة معزولة لهذا الجهاز" : "Anonymous session isolated to this device"}>
          <span><BadgeCheck size={18} /></span>
          <div>
            <strong>{ar ? "استكشاف مفتوح" : "Open exploration"}</strong>
            <small>{ar ? "تقدم خاص بهذا الجهاز" : "Private device progress"}</small>
          </div>
        </div>}
      </footer>
    </aside>
  );
}
