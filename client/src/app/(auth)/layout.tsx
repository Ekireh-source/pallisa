import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (

      <div className="h-screen flex">
        <div className="hidden lg:grid lg:w-1/2 bg-[#F8F8FA]">
          <div className="flex items-center gap-4 pl-9 pt-4">
            <Link href="/" className="flex items-center gap-4">
              <Image src="/images/baisoft-logo.png" width={44} height={44} alt="" className="rounded" />
              <h1 className="font-bold text-2xl">CS REPORT</h1>
            </Link>
          </div>
          <div className="size-full p-9 flex items-center justify-center">
            <Image
              src="/images/Payment-image.svg"
              alt=""
              width={400}
              height={400}
              className="w-3/4"
            />
          </div>
          <p className="text-sm opacity-50 flex items-end -mt-10 p-4 w-full">
            &copy; {new Date().getFullYear()} Baisoft. All Rights Reserved
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </div>
 
  );
}
