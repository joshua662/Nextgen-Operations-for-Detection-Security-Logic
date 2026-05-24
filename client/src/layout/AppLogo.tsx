import { Link } from "react-router-dom";

type AppLogoProps = {
    homePath?: string;
};

const AppLogo = ({ homePath = "/dashboard" }: AppLogoProps) => (
    <Link to={homePath} className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
            G
        </div>
        <div className="grid flex-1 text-start text-sm">
            <span className="truncate font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                Gate Security
            </span>
        </div>
    </Link>
);

export default AppLogo;
