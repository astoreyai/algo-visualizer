import React, { memo } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';

export const EntryExitNode = memo(({ id, selected }: any) => {
  return (
    <BaseNode
      title="Strategy Output"
      selected={selected}
      handles={[
        { type: 'target', position: Position.Left, id: 'price', style: { top: '25%', background: '#3b82f6' } },
        { type: 'target', position: Position.Left, id: 'entries', style: { top: '50%', background: '#10b981' } },
        { type: 'target', position: Position.Left, id: 'exits', style: { top: '75%', background: '#ef4444' } }
      ]}
    >
      <div className="flex flex-col gap-1 text-[10px] uppercase font-bold text-gray-400">
        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Price</div>
        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Entries</div>
        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Exits</div>
      </div>
    </BaseNode>
  );
});

EntryExitNode.displayName = "EntryExitNode";
