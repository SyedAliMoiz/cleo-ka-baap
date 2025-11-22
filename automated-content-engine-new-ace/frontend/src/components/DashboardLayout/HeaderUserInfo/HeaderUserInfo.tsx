import React, { useState } from "react";

type Props = {
  user: {
    email: string;
    tier: string;
    isAdmin: boolean;
  };
  logout: () => void;
};

function HeaderUserInfo({ user, logout }: Props) {
  function renderTier() {
    console.log("here", user?.tier);
    if (user?.tier?.toLowerCase() === "mvp") {
      return "Core Tools";
    }
    if (user?.tier?.toLowerCase() === "pro+") {
      return "pro";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <p className="text-sm text-foreground">{user.email}</p>
        <div className="flex items-center justify-end gap-2">
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Tier: {renderTier()}
          </span>
          {user.isAdmin && (
            <span className="inline-flex items-center rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
              Admin
            </span>
          )}
        </div>
      </div>
      <ProfileMenu
        userInitial={(user?.email || "?").charAt(0).toUpperCase()}
        onLogout={logout}
      />
    </div>
  );
}

export default HeaderUserInfo;

type ProfileMenuProps = {
  userInitial: string;
  onLogout: () => void;
};

function ProfileMenu({ userInitial, onLogout }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="h-8 w-8 rounded-full bg-muted text-foreground/90 grid place-items-center text-sm font-semibold ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
      >
        {userInitial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
