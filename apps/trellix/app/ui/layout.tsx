import { logout } from "../actions/auth/actions.ts";
import { routes } from "../routes.ts";
import { getCurrentAccountSafely } from "../utils/context.ts";
import { Document } from "./document.tsx";
import { LogoutIcon } from "./icons.tsx";

export interface LayoutProps {
  title?: string;
  children?: React.ReactNode;
}

export function Layout({ title, children }: LayoutProps) {
  let account = getCurrentAccountSafely();

  return (
    <Document title={title}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-8 py-4">
          <a href={account ? routes.boards.index.href() : routes.home.href()} className="block">
            <div className="text-2xl leading-6 font-black text-white">Trellix</div>
            <div className="text-slate-500">a react-frame demo</div>
          </a>

          {account ? (
            <div className="flex items-center gap-6">
              <span className="text-sm text-slate-400">{account.email}</span>
              <form action={logout}>
                <button type="submit" className="block text-center text-white">
                  <LogoutIcon />
                  <span className="block text-xs font-bold text-slate-500 uppercase">Log out</span>
                </button>
              </form>
            </div>
          ) : (
            <a
              href={routes.auth.login.index.href()}
              className="text-xs font-bold text-slate-400 uppercase"
            >
              Log in
            </a>
          )}
        </div>

        <div className="h-full min-h-0 grow">{children}</div>
      </div>
    </Document>
  );
}
