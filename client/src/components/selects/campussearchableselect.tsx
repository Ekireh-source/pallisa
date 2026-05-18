"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { FetchCampuses } from "@/features/school/school.service";
import { ICampusListResponse } from "@/features/school/school.schemas";
import { getPaginatedFromUrl } from "@/lib/utils";
import PaginatedSearchableSelect, {
  PaginatedSelectItem,
  PaginatedSelectItemWithIdValueLabel,
} from "./paginatedselectable";

export interface CampusSearchableSelectProps {
  value: string | (string | number)[];
  onValueChange: (value: any) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  outerContainerClassName?: string;
  triggerClassName?: string;
  multiple?: boolean;
  initialItems?: Array<PaginatedSelectItemWithIdValueLabel>;
}

export const CampusSearchableSelect = memo(
  ({
    value,
    onValueChange,
    disabled = false,
    placeholder = "Select Campus",
    className,
    outerContainerClassName,
    triggerClassName,
    multiple = false,
    initialItems,
  }: CampusSearchableSelectProps) => {
    const [selectedItems, setSelectedItems] = useState<Array<string | number>>([]);

    useEffect(() => {
      if (Array.isArray(value)) {
        setSelectedItems(value);
      } else {
        setSelectedItems(value && value !== "all" ? [value] : []);
      }
    }, [value]);

    const fetchFirstPage = useCallback(
      async (query?: { search?: string; page?: number } | unknown) => {
        const typedQuery = query as { search?: string; page?: number } | undefined;

        const result = await FetchCampuses({
          page: typedQuery?.page || 1,
          search: typedQuery?.search || "",
        });

        if ("error" in result) {
          throw result.error;
        }

        return result;
      },
      []
    );

    const handleSelect = useCallback(
      (
        itemIds: (string | number)[],
        _items: PaginatedSelectItem<ICampusListResponse>[]
      ) => {
        if (multiple) {
          const newSelectedItems = [
            ...selectedItems,
            ...itemIds.filter(
              (id) =>
                !selectedItems.some(
                  (selectedId) => selectedId.toString() === id.toString()
                )
            ),
          ];
          setSelectedItems(newSelectedItems);
          onValueChange(newSelectedItems);
          return;
        }

        const newValue = itemIds[0]?.toString() || "all";
        setSelectedItems(itemIds);
        onValueChange(newValue);
      },
      [multiple, onValueChange, selectedItems]
    );

    const handleRemove = useCallback(
      (itemIds: (string | number)[]) => {
        if (multiple) {
          const newSelectedItems = selectedItems.filter(
            (id) => !itemIds.some((itemId) => itemId.toString() === id.toString())
          );
          setSelectedItems(newSelectedItems);
          onValueChange(newSelectedItems);
          return;
        }

        setSelectedItems([]);
        onValueChange("all");
      },
      [multiple, onValueChange, selectedItems]
    );

    return (
      <div className={`w-full !min-h-max inline-block ${className || ""}`}>
        <PaginatedSearchableSelect<ICampusListResponse>
          paginated={true}
          fetchFirstPage={fetchFirstPage}
          fetchFromUrl={getPaginatedFromUrl}
          getItemId={(item) => item.id}
          getItemValue={(item) => item.public_id}
          getItemLabel={(item) => item.name}
          selectedItems={selectedItems}
          onSelect={handleSelect}
          onRemove={handleRemove}
          multiple={multiple}
          disabled={disabled}
          className={className}
          outerContainerClassName={outerContainerClassName}
          triggerClassName={triggerClassName}
          placeholder={placeholder}
          emptyMessage="No campuses found."
          initialItems={initialItems}
          label="Campus"
        />
      </div>
    );
  }
);

CampusSearchableSelect.displayName = "CampusSearchableSelect";

export default CampusSearchableSelect;
