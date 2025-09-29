"use client";

import React from "react";

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<string>(() =>
    typeof window === "undefined" ? "default" : localStorage.getItem("gv-theme") || "default"
  );

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("gv-theme", theme);
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === "default" ? "sunset" : "default"))}
      className="btn-secondary px-3 py-2"
      title="切换主题"
    >
      {theme === "default" ? "🌇 Sunset" : "🌌 Neo"}
    </button>
  );
}




