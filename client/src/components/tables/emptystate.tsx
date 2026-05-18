"use client";


import Image from "next/image";

export function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <Image src="/images/emptystate.png" alt="empty state" width={89} height={89} />
            <h3 className="text-[16px] font-medium text-My-Black mb-1">No Data</h3>
            <p className="text-[14px] text-gray-600">There is no data to show you right now</p>
        </div>
    );
}
