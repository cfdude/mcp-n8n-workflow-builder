export { 
  getNodeNames, 
  getNode, 
  updateNode,
  batchGetNodes,
  batchUpdateNodes 
} from './nodeOperationsService';

export type { NodeSummary, ExtractedNode } from './nodeExtractor';
export type { NodeUpdate, MergeResult } from './nodeMerger';