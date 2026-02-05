import React, { memo } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import useStore from '@/store/useStore';

export const IndicatorNode = memo(({ id, data, selected }: any) => {
  return (
    <BaseNode
      title="Indicator"
      selected={selected}
      handles={[
        { type: 'target', position: Position.Left, id: 'input' },
        { type: 'source', position: Position.Right, id: 'output' }
      ]}
    >
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-gray-400 uppercase font-bold">Type</div>
        <div className="text-sm font-medium text-gray-700">{data.indicatorType || 'SMA'}</div>
        
        <div className="mt-2 text-[10px] text-gray-400 uppercase font-bold">Window</div>
        <div className="text-sm font-medium text-gray-700">{data.window || 14}</div>
      </div>
    </BaseNode>
  );
});

IndicatorNode.displayName = "IndicatorNode";
