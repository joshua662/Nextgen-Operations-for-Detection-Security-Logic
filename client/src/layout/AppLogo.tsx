import { Link } from "react-router-dom";
import puebloShellLogo from "../assets/img/pueblo-shell-logo.png";

type AppLogoProps = {
    homePath?: string;
};

const AppLogo = ({ homePath = "/dashboard" }: AppLogoProps) => (
    <Link to={homePath} className="flex items-center gap-3.5 group cursor-pointer">
        <div className="relative shrink-0 overflow-visible">
            <img
                src={puebloShellLogo}
                alt="Pueblo de Panay Logo"
                className="h-10 w-auto object-contain transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:rotate-[-2deg] group-hover:drop-shadow-[0_0_14px_rgba(197,160,115,0.6)] animate-logo-pulse"
            />
        </div>
        <div className="flex flex-col items-center justify-center text-center select-none shrink-0 leading-none transition-transform duration-300 ease-out group-hover:translate-x-0.5">
            <span className="inline-block font-serif italic text-white text-[16px] tracking-wide border-b border-white/40 pb-[1.5px] px-0.5 leading-none font-semibold text-center transition-all duration-300 group-hover:text-[#C5A073] group-hover:border-[#C5A073] group-hover:tracking-wider">
                Pueblo de Panay
            </span>
            <span className="text-[8px] font-sans font-bold uppercase tracking-[0.22em] text-zinc-400 text-center mt-[2.5px] leading-none transition-all duration-300 group-hover:text-zinc-200 group-hover:tracking-[0.28em]">
                TOWNSHIP
            </span>
            <span className="text-[10px] font-serif italic text-zinc-300 tracking-wider text-center mt-[2px] leading-none transition-all duration-300 group-hover:text-[#E2C7A7]">
                Life. Work. Balance.
            </span>
        </div>
    </Link>
);

export default AppLogo;
