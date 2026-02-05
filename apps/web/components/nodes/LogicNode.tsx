import React, { memo } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import useStore from '@/store/useStore';

export const LogicNode = memo(({ id, data, selected }: any) => {
  return (
    <BaseNode
      title="Logic"
      selected={selected}
      handles={[
        { type: 'target', position: Position.Left, id: 'a', style: { top: '30%' } },
        { type: 'target', position: Position.Left, id: 'b', style: { top: '70%' } },
        { type: 'source', position: Position.Right, id: 'output' }
      ]}
    >
      <div className="flex flex-col items-center justify-center py-2">
        <div className="text-xl font-bold text-gray-800">{data.operator || '>'}</div>
        <div className="text-[8px] text-gray-400 uppercase mt-1 italic">Compare A & B</div>
      </div>
    </BaseNode>
  );
});

LogicNode.displayName = "LogicNode";
