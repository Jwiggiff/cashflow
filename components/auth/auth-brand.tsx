import Image from "next/image";

export function AuthBrand() {
  return (
    <div className="flex justify-center">
      <Image
        src="/wordmark.svg"
        alt="CashFlow"
        width={160}
        height={40}
        className="h-10 w-auto invert dark:invert-0"
        priority
      />
    </div>
  );
}
