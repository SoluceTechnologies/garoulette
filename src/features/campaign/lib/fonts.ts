import { Baloo_2, Comfortaa, Fredoka, Montserrat, Nunito, Outfit, Poppins, Quicksand } from "next/font/google";

const comfortaa = Comfortaa({ subsets: ["latin"], variable: "--font-comfortaa" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" });
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-baloo" });
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand" });

/** className for each whitelisted font, in the same order as `FONT_MAP`. */
const FONT_CLASSNAMES = [
  comfortaa.variable,
  outfit.variable,
  poppins.variable,
  montserrat.variable,
  nunito.variable,
  fredoka.variable,
  baloo.variable,
  quicksand.variable,
];

/** All font variable classNames — attach once to <html> so every var is defined. */
export const campaignFontVariables = FONT_CLASSNAMES.join(" ");

export { FONT_MAP, FONT_OPTIONS, resolveFontVar } from "./font-map";
