"use client";

import { memo, useCallback, useEffect, useState } from "react";
import PaginatedSearchableSelect, {
  PaginatedSelectItem,
  PaginatedSelectItemWithIdValueLabel,
} from "./paginatedselectable";
import { FetchTerms } from "@/features/members/members.service";
import { ITermListResponse } from "@/features/members/members.schemas";
import { getPaginatedFromUrl } from "@/lib/utils";

export interface TermSearchableSelectProps {
  value: string | (string | number)[];
  onValueChange: (value: any) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  outerContainerClassName?: string;
  triggerClassName?: string;
  multiple?: boolean;
  initialItems?: Array<PaginatedSelectItemWithIdValueLabel>;
  academicYearId?: string | number; // Optional filter by academic year
}

export const TermSearchableSelect = memo(
  ({
    value,
    onValueChange,
    disabled = false,
    placeholder = "Select Term",
    className,
    outerContainerClassName,
    triggerClassName,
    multiple = false,
    initialItems,
    academicYearId,
  }: TermSearchableSelectProps) => {
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

        const params: any = {
          page: typedQuery?.page || 1,
          search: typedQuery?.search || "",
        };

        if (academicYearId && academicYearId !== "all") {
          params.academic_year_id = academicYearId;
        }

        const result = await FetchTerms(params);

        if ("error" in result) {
          throw result.error;
        }

        return result;
      },
      [academicYearId]
    );

    const handleSelect = useCallback(
      (
        itemIds: (string | number)[],
        _items: PaginatedSelectItem<ITermListResponse>[]
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
        <PaginatedSearchableSelect<ITermListResponse>
          paginated={true}
          fetchFirstPage={fetchFirstPage}
          fetchFromUrl={getPaginatedFromUrl}
          getItemId={(item) => item.id}
          getItemValue={(item) => item.id.toString()}
          getItemLabel={(item) => {
            const yearSuffix = item.academic_year_name ? ` (${item.academic_year_name})` : "";
            return `${item.name}${yearSuffix}`;
          }}
          selectedItems={selectedItems}
          onSelect={handleSelect}
          onRemove={handleRemove}
          multiple={multiple}
          disabled={disabled}
          className={className}
          outerContainerClassName={outerContainerClassName}
          triggerClassName={triggerClassName}
          placeholder={placeholder}
          emptyMessage="No terms found."
          initialItems={initialItems}
          label="Term"
        />
      </div>
    );
  }
);

TermSearchableSelect.displayName = "TermSearchableSelect";

export default TermSearchableSelect;
