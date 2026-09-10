import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Home,
  Compass,
  Sparkles,
  RotateCcw,
  Network,
  Library,
  BookOpen,
  Settings,
  Headphones,
  Users,
  Shield,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
export default function ProductSidebar({
  language,
}: {
  language: "ar" | "en";
}) {
  const { user, signOut } = useAuth();
  const [role, setRole] = useState("student");
  const ar = language === "ar";
  useEffect(() => {
    let active = true;
    setRole("student");
    if (user && supabase)
      void supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (active && data?.role) setRole(data.role);
        });
    return () => {
      active = false;
    };
  }, [user]);
  if (!user) return null;
  const items = [
    ["/dashboard", "اليوم", "Today", Home],
    ["/workspace", "تعلّمي", "Learn", Compass],
    ["/ask-fahim", "اسأل فَهيم", "Ask Fahim", Sparkles],
    ["/review", "الذاكرة", "Review", RotateCcw],
    ["/passport", "خريطة التقدّم", "Progress", Network],
    ["/knowledge-vault", "مكتبتي", "My library", Library],
    ["/resources", "المصادر", "Sources", BookOpen],
  ] as const;
  return (
    <aside className="product-sidebar">
      <Link className="sidebar-brand" to="/dashboard">
        <img src="/brand/fahim-icon.svg" width="36" height="36" alt="" />
        <div>
          <strong>فَهيم</strong>
          <small>{ar ? "نظام الفهم الموثّق" : "Verified Learning OS"}</small>
        </div>
      </Link>
      <p className="os-eyebrow">
        {ar ? "مساحتك للتعلّم" : "Your learning space"}
      </p>
      <nav aria-label={ar ? "التنقل داخل المنصة" : "Workspace navigation"}>
        {items.map(([to, arabic, english, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""} ${to === "/ask-fahim" ? "sidebar-ai" : ""}`
            }
          >
            <Icon size={19} />
            {ar ? arabic : english}
          </NavLink>
        ))}
        {["teacher", "instructor", "admin", "moderator"].includes(role) && (
          <NavLink to="/teacher" className="sidebar-link">
            <Users size={19} />
            {ar ? "غرفة المعلم" : "Teacher"}
          </NavLink>
        )}
        {role === "admin" && (
          <NavLink to="/admin" className="sidebar-link">
            <Shield size={19} />
            {ar ? "الإدارة" : "Admin"}
          </NavLink>
        )}
      </nav>
      <footer>
        <Link to="/support" className="sidebar-link">
          <Headphones size={18} />
          {ar ? "المساعدة" : "Support"}
        </Link>
        <Link to="/profile" className="sidebar-link">
          <Settings size={18} />
          {ar ? "الحساب والإعدادات" : "Account & settings"}
        </Link>
        <div className="sidebar-account">
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
        </div>
      </footer>
    </aside>
  );
}
