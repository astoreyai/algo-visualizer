import React, { memo } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import useStore from '@/store/useStore';

export const DataSourceNode = memo(({ id, data, selected }: any) => {
  return (
    <BaseNode
      title="Data Source"
      selected={selected}
      handles={[{ type: 'source', position: Position.Right, id: 'output' }]}
    >
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-gray-400 uppercase font-bold">Symbol</div>
        <div className="text-sm font-bold text-blue-600">{data.symbol || 'BTC-USD'}</div>
        
        <div className="mt-2 text-[10px] text-gray-400 uppercase font-bold">Interval</div>
        <div className="text-sm font-medium text-gray-700">{data.interval || '1d'}</div>
      </div>
    </BaseNode>
  );
});

DataSourceNode.displayName = "DataSourceNode";
