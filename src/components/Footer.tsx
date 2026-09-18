import { Link } from "react-router-dom";
import { ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import FahimBrand from "@/components/brand/FahimBrand";

export default function Footer({ language }: { language: "ar" | "en" }) {
  const rtl = language === "ar";
  const groups = [
    {
      title: rtl ? "المنتج" : "Product",
      links: [
        [rtl ? "كيف يعمل" : "How it works", "/how-it-works"],
        [rtl ? "المسارات" : "Paths", "/courses"],
        [rtl ? "الأسعار" : "Pricing", "/pricing"],
        [rtl ? "مصادر مصر" : "Egypt sources", "/resources"],
      ],
    },
    {
      title: rtl ? "الشركة" : "Company",
      links: [
        [rtl ? "عن فَهيم والمؤسس" : "About Fahim and founder", "/about"],
        [rtl ? "إنشاء حساب" : "Create account", "/register"],
        [rtl ? "تسجيل الدخول" : "Sign in", "/login"],
      ],
    },
    {
      title: rtl ? "الثقة" : "Trust",
      links: [
        [rtl ? "مركز الثقة" : "Trust Center", "/trust"],
        [rtl ? "الخصوصية" : "Privacy", "/privacy"],
        [rtl ? "شروط الاستخدام" : "Terms", "/terms"],
        [rtl ? "سياسة AI" : "AI policy", "/ai-policy"],
        [rtl ? "الشارات والشهادات" : "Credentials", "/credentials-policy"],
      ],
    },
  ];
  return (
    <footer className="border-t border-white/10 bg-[#14213D] pb-20 text-blue-100 sm:pb-0">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 xl:grid-cols-[1.25fr_.7fr_.7fr_.8fr] lg:px-8">
        <div>
          <Link to="/" className="fahim-footer-brand inline-flex items-center gap-3">
            <FahimBrand language={language} onDark />
          </Link>
          <p className="mt-5 max-w-md text-sm leading-8 text-blue-100">
            {rtl
              ? "نظام تشغيل عربي للفهم الموثق: من المصدر والمحاولة إلى الخطأ والمراجعة والدليل."
              : "An Arabic-first operating system for verified understanding: from source and attempt to error, review, and evidence."}
          </p>
          <p className="mt-5 flex items-center gap-2 text-xs font-bold text-teal-300">
            <ShieldCheck className="h-4 w-4" />
            {rtl
              ? "لا ادعاء اعتماد أو شراكات أو دفع دون تحقق"
              : "No unverified accreditation, partnerships, or payment activation"}
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs text-blue-300">
            <MapPin className="h-4 w-4" />
            Cairo, Egypt
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="border-b border-white/15 pb-3 text-xs font-black uppercase tracking-widest text-white">
              {group.title}
            </h2>
            <ul className="mt-4 space-y-3">
              {group.links.map(([label, href]) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="inline-flex min-h-11 items-center text-sm text-blue-200 transition-colors hover:text-[#F2B84B]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 py-5 text-[10px] leading-6 text-blue-300 sm:px-6 md:flex-row lg:px-8">
          <p>
            © 2026 FAHIM.{" "}
            {rtl
              ? "المحتوى الخارجي وحقوقه لأصحابه."
              : "External content remains the property of its owners."}
          </p>
          <p>
            {rtl
              ? "فَهيم غير تابع لوزارة التعليم أو YouTube أو Wikimedia أو OpenAlex. الاشتراكات تُفعّل فقط بعد مراجعة إثبات الدفع."
              : "Fahim is not affiliated with MOE, YouTube, Wikimedia, or OpenAlex. Subscriptions activate only after payment evidence review."}
          </p>
          <a
            href="https://www.marwan-abdelghaffar.us/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1 font-black text-[#F2B84B]"
          >
            {rtl ? "بُني في مصر" : "Built in Egypt"}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
