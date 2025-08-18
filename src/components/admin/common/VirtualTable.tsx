"use client";
import React from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

export function VirtualTable<T>({
  items,
  rowHeight,
  renderRow,
  overscan = 6,
}: {
  items: T[];
  rowHeight: number;
  overscan?: number;
  renderRow: (p: { item: T; index: number }) => React.ReactNode;
}) {
  const Row = React.useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const item = items[index];
      return (
        <div style={style} key={index}>
          {renderRow({ item, index })}
        </div>
      );
    },
    [items, renderRow],
  );

  // กำหนดความสูงรวมขั้นต่ำ ถ้ารายการน้อย
  const minH = Math.max(1, Math.min(items.length, 10)) * rowHeight;

  return (
    <div className="h-[480px] w-full" style={{ minHeight: minH }}>
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={rowHeight}
            overscanCount={overscan}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
}
