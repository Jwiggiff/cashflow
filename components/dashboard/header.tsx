import { Greeting } from "./greeting";
import { PrivacyToggle } from "../privacy-toggle";

export function Header() {
  return (
    <div className="flex items-center justify-between p-8">
      <Greeting />
      <PrivacyToggle />
    </div>
  );
} 