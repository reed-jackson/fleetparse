import { Inter } from "next/font/google";

import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "FleetParse Demo",
	description: "Magic with Fleetio",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<Theme accentColor="grass">{children}</Theme>
			</body>
		</html>
	);
}
