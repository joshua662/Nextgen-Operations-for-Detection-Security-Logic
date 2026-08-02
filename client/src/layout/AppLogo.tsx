import { Link } from "react-router-dom";
import puebloShellLogo from "../assets/img/pueblo-shell-logo.png";

type AppLogoProps = {
    homePath?: string;
};

const AppLogo = ({ homePath = "/dashboard" }: AppLogoProps) => (
    <Link to={homePath} className="flex items-center gap-3.5">
        <img src={puebloShellLogo} alt="Pueblo de Panay Logo" className="h-10 w-auto shrink-0 object-contain" />
        <div className="flex flex-col items-center justify-center text-center select-none shrink-0 leading-none">
            <span className="inline-block font-serif italic text-white text-[16px] tracking-wide border-b border-white/40 pb-[1.5px] px-0.5 leading-none font-semibold text-center">
                Pueblo de Panay
            </span>
            <span className="text-[8px] font-sans font-bold uppercase tracking-[0.22em] text-zinc-400 text-center mt-[2.5px] leading-none">
                TOWNSHIP
            </span>
            <span className="text-[10px] font-serif italic text-zinc-300 tracking-wider text-center mt-[2px] leading-none">
                Life. Work. Balance.
            </span>
        </div>
    </Link>
);

export default AppLogo;
