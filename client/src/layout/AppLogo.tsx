import { Link } from "react-router-dom";
import guardLogo from "../assets/img/guard-gate-logo.svg";

type AppLogoProps = {
    homePath?: string;
};

const AppLogo = ({ homePath = "/dashboard" }: AppLogoProps) => (
    <Link to={homePath} className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md border border-white/20 overflow-hidden">
            <img src={guardLogo} alt="Security Guard Gate Access" className="h-full w-full object-contain" />
        </div>
        <div className="grid flex-1 text-start text-sm">
            <span className="truncate font-bold leading-tight text-zinc-900 dark:text-zinc-100">
                Gate Security
            </span>
        </div>
    </Link>
);

export default AppLogo;
