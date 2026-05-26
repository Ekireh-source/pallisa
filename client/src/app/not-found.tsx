import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
    return (
        <>
            <div className="flex flex-col lg:flex-row h-screen w-full">
                <div className="hidden lg:flex lg:w-1/2 flex-col items-center relative justify-center h-full">
                    <div className="w-full p-12 xl:p-40">
                        <img
                            src={`/images/not-found.svg`}
                            alt="Login Contract"
                            className="!w-full !max-w-full"
                        />
                    </div>
                </div>
                <div className="w-full flex flex-col items-center justify-center h-full lg:w-1/2 border-none flex items-center justify-center overflow-y-auto">
                    <div className="w-full flex flex-col gap-y-6 items-center text-center px-4 lg:items-start lg:text-left lg:px-0">
                        {/* Error Message */}
                        <h1 className="text-6xl font-bold text-gray-700">404 </h1>
                        <h1 className="text-4xl font-bold text-gray-900">Page Not Found </h1>
                        <p className="text-lg text-gray-600 mb-8">
                            Page you are trying to open does not exist.
                            <br /> You may have mistyped the address, or the page has been moved to another URL.
                        </p>

                        {/* Back to Home Button */}
                        <Link href="/dashboard">
                            <Button className="rounded-xl hover:bg-primary/90 !px-16">Go Back Home</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
