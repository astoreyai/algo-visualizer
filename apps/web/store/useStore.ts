import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

type RFState = {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  optimizationRanges: any[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeData: (id: string, data: any) => void;
  setOptimizationRange: (range: any) => void;
  removeOptimizationRange: (nodeId: string, parameter: string) => void;
  loadGraph: (nodes: Node[], edges: Edge[]) => void;
  resetGraph: () => void;
};

const useStore = create<RFState>((set, get) => ({
  nodes: [
    { id: '1', type: 'dataSource', position: { x: 100, y: 100 }, data: { symbol: 'BTC-USD' } },
    { id: '2', type: 'indicator', position: { x: 400, y: 100 }, data: { indicatorType: 'SMA', window: 20 } },
  ],
  edges: [],
  selectedNodeId: null,
  optimizationRanges: [],
  onNodesChange: (changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === 'select') {
        set({ selectedNodeId: change.selected ? change.id : null });
      }
    });

    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, ...data };
        }
        return node;
      }),
    });
  },
  loadGraph: (nodes, edges) => {
    set({ nodes, edges, selectedNodeId: null, optimizationRanges: [] });
  },
  resetGraph: () => {
    set({ 
      nodes: [], 
      edges: [], 
      selectedNodeId: null, 
      optimizationRanges: [] 
    });
  },
  setOptimizationRange: (range) => {
    const existing = get().optimizationRanges.find(r => r.node_id === range.node_id && r.parameter === range.parameter);
    if (existing) {
      set({
        optimizationRanges: get().optimizationRanges.map(r => 
          (r.node_id === range.node_id && r.parameter === range.parameter) ? range : r
        )
      });
    } else {
      set({ optimizationRanges: [...get().optimizationRanges, range] });
    }
  },
  removeOptimizationRange: (nodeId, parameter) => {
    set({
      optimizationRanges: get().optimizationRanges.filter(r => !(r.node_id === nodeId && r.parameter === parameter))
    });
  },
}));

export default useStore;
