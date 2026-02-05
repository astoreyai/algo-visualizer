import React, { ReactNode } from 'react';
import { Handle, Position } from 'reactflow';
import { clsx } from 'clsx';

interface BaseNodeProps {
  title: string;
  children?: ReactNode;
  selected?: boolean;
  handles?: { type: 'source' | 'target'; position: Position; id?: string; style?: React.CSSProperties }[];
}

export const BaseNode = ({ title, children, selected, handles = [] }: BaseNodeProps) => {
  return (
    <div className={clsx(
      "bg-white border-2 rounded-md shadow-sm min-w-[150px]",
      selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
    )}>
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 rounded-t-md">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-3">
        {children}
      </div>
      
      {handles.map((handle, i) => (
        <Handle
          key={i}
          type={handle.type}
          position={handle.position}
          id={handle.id}
          style={handle.style}
          className="w-3 h-3 bg-blue-500 border-2 border-white"
        />
      ))}
    </div>
  );
};
