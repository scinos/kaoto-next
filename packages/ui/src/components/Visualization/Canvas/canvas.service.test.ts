import {
  BreadthFirstLayout,
  ColaLayout,
  ConcentricLayout,
  DagreLayout,
  DefaultEdge,
  DefaultGroup,
  DefaultNode,
  EdgeAnimationSpeed,
  EdgeStyle,
  ForceLayout,
  GraphComponent,
  GridLayout,
  ModelKind,
  Visualization,
} from '@patternfly/react-topology';
import { VisualizationNode } from '../../../models/visualization';
import { LayoutType } from './canvas.models';
import { CanvasService } from './canvas.service';

describe('CanvasService', () => {
  const DEFAULT_NODE_PROPS = {
    type: 'node',
    data: undefined,
    shape: CanvasService.DEFAULT_NODE_SHAPE,
    width: CanvasService.DEFAULT_NODE_DIAMETER,
    height: CanvasService.DEFAULT_NODE_DIAMETER,
  };

  const DEFAULT_EDGE_PROPS = {
    type: 'edge',
    edgeStyle: EdgeStyle.dashed,
    animationSpeed: EdgeAnimationSpeed.medium,
  };

  it('should start with an empty nodes array', () => {
    expect(CanvasService.nodes).toEqual([]);
  });

  it('should start with an empty edges array', () => {
    expect(CanvasService.edges).toEqual([]);
  });

  it('should allow consumers to create a new controller and register its factories', () => {
    const layoutFactorySpy = jest.spyOn(Visualization.prototype, 'registerLayoutFactory');
    const componentFactorySpy = jest.spyOn(Visualization.prototype, 'registerComponentFactory');

    const controller = CanvasService.createController();

    expect(controller).toBeInstanceOf(Visualization);
    expect(layoutFactorySpy).toHaveBeenCalledWith(CanvasService.baselineLayoutFactory);
    expect(componentFactorySpy).toHaveBeenCalledWith(CanvasService.baselineComponentFactory);
  });

  describe('baselineComponentFactory', () => {
    it('should return the correct component for a group', () => {
      const component = CanvasService.baselineComponentFactory({} as ModelKind, 'group');

      expect(component).toEqual(DefaultGroup);
    });

    it('should return the correct component for a graph', () => {
      const component = CanvasService.baselineComponentFactory(ModelKind.graph, 'graph');

      expect(component).toEqual(GraphComponent);
    });

    it('should return the correct component for a node', () => {
      const component = CanvasService.baselineComponentFactory(ModelKind.node, 'node');

      expect(component).toEqual(DefaultNode);
    });

    it('should return the correct component for an edge', () => {
      const component = CanvasService.baselineComponentFactory(ModelKind.edge, 'edge');

      expect(component).toEqual(DefaultEdge);
    });

    it('should return undefined for an unknown type', () => {
      const component = CanvasService.baselineComponentFactory({} as ModelKind, 'unknown');

      expect(component).toBeUndefined();
    });
  });

  it.each([
    [LayoutType.BreadthFirst, BreadthFirstLayout],
    [LayoutType.Cola, ColaLayout],
    [LayoutType.ColaNoForce, ColaLayout],
    [LayoutType.ColaGroups, ColaLayout],
    [LayoutType.Concentric, ConcentricLayout],
    [LayoutType.Dagre, DagreLayout],
    [LayoutType.Force, ForceLayout],
    [LayoutType.Grid, GridLayout],
    ['unknown' as LayoutType, ColaLayout],
  ] as const)('baselineLayoutFactory [%s]', (type, layout) => {
    const newController = CanvasService.createController();
    newController.fromModel(
      {
        nodes: [],
        edges: [],
        graph: {
          id: 'g1',
          type: 'graph',
          layout: CanvasService.DEFAULT_LAYOUT,
        },
      },
      false,
    );
    const layoutFactory = CanvasService.baselineLayoutFactory(type, newController.getGraph());

    expect(layoutFactory).toBeInstanceOf(layout);
  });

  describe('getFlowDiagram', () => {
    it('should return nodes and edges for a simple VisualizationNode', () => {
      const vizNode = new VisualizationNode('node');

      const { nodes, edges } = CanvasService.getFlowDiagram(vizNode);

      expect(nodes).toEqual([
        {
          id: 'node-1234',
          label: 'node',
          parentNode: undefined,
          ...DEFAULT_NODE_PROPS,
        },
      ]);
      expect(edges).toEqual([]);
    });

    it('should return nodes and edges for a two-nodes VisualizationNode', () => {
      const vizNode = new VisualizationNode('node');
      const childNode = new VisualizationNode('child');
      vizNode.addChild(childNode);

      const { nodes, edges } = CanvasService.getFlowDiagram(vizNode);

      expect(nodes).toEqual([
        {
          id: 'node-1234',
          label: 'node',
          parentNode: undefined,
          ...DEFAULT_NODE_PROPS,
        },
        {
          id: 'child-1234',
          label: 'child',
          parentNode: 'node-1234',
          ...DEFAULT_NODE_PROPS,
        },
      ]);
      expect(edges).toEqual([
        {
          id: 'node-1234-to-child-1234',
          source: 'node-1234',
          target: 'child-1234',
          ...DEFAULT_EDGE_PROPS,
        },
      ]);
    });

    it('should return nodes and edges for a multiple nodes VisualizationNode', () => {
      const vizNode = new VisualizationNode('node');

      const setHeaderNode = new VisualizationNode('set-header');
      vizNode.setNextNode(setHeaderNode);
      setHeaderNode.setPreviousNode(vizNode);

      const choiceNode = new VisualizationNode('choice');
      setHeaderNode.setNextNode(choiceNode);
      choiceNode.setPreviousNode(setHeaderNode);

      const directNode = new VisualizationNode('direct');
      choiceNode.setNextNode(directNode);
      directNode.setPreviousNode(choiceNode);

      const whenNode = new VisualizationNode('when');
      choiceNode.addChild(whenNode);

      const otherwiseNode = new VisualizationNode('otherwise');
      choiceNode.addChild(otherwiseNode);

      const whenLeafNode = new VisualizationNode('when-leaf');
      whenNode.addChild(whenLeafNode);

      const processNode = new VisualizationNode('process');
      otherwiseNode.addChild(processNode);
      const logNode = new VisualizationNode('log');
      processNode.addChild(logNode);

      const { nodes, edges } = CanvasService.getFlowDiagram(vizNode);

      expect(nodes).toEqual([
        {
          id: 'node-1234',
          label: 'node',
          parentNode: undefined,
          ...DEFAULT_NODE_PROPS,
        },
        {
          id: 'set-header-1234',
          label: 'set-header',
          parentNode: undefined,
          ...DEFAULT_NODE_PROPS,
        },
        {
          id: 'choice-1234',
          label: 'choice',
          parentNode: undefined,
          ...DEFAULT_NODE_PROPS,
        },
        {
          id: 'when-1234',
          label: 'when',
          parentNode: 'choice-1234',
          ...DEFAULT_NODE_PROPS,
        },
        {
          id: 'when-leaf-1234',
          label: 'when-leaf',
          parentNode: 'when-1234',
          ...DEFAULT_NODE_PROPS,
        },
        {
          id: 'otherwise-1234',
          label: 'otherwise',
          parentNode: 'choice-1234',
          ...DEFAULT_NODE_PROPS,
        },
        {
          id: 'process-1234',
          label: 'process',
          parentNode: 'otherwise-1234',
          ...DEFAULT_NODE_PROPS,
        },
        {
          id: 'log-1234',
          label: 'log',
          parentNode: 'process-1234',
          ...DEFAULT_NODE_PROPS,
        },
        {
          id: 'direct-1234',
          label: 'direct',
          parentNode: undefined,
          ...DEFAULT_NODE_PROPS,
        },
      ]);
      expect(edges).toEqual([
        {
          id: 'node-1234-to-set-header-1234',
          source: 'node-1234',
          target: 'set-header-1234',
          ...DEFAULT_EDGE_PROPS,
        },
        {
          id: 'set-header-1234-to-choice-1234',
          source: 'set-header-1234',
          target: 'choice-1234',
          ...DEFAULT_EDGE_PROPS,
        },
        {
          id: 'choice-1234-to-when-1234',
          source: 'choice-1234',
          target: 'when-1234',
          ...DEFAULT_EDGE_PROPS,
        },
        {
          id: 'when-1234-to-when-leaf-1234',
          source: 'when-1234',
          target: 'when-leaf-1234',
          ...DEFAULT_EDGE_PROPS,
        },
        {
          id: 'choice-1234-to-otherwise-1234',
          source: 'choice-1234',
          target: 'otherwise-1234',
          ...DEFAULT_EDGE_PROPS,
        },
        {
          id: 'otherwise-1234-to-process-1234',
          source: 'otherwise-1234',
          target: 'process-1234',
          ...DEFAULT_EDGE_PROPS,
        },
        {
          id: 'process-1234-to-log-1234',
          source: 'process-1234',
          target: 'log-1234',
          ...DEFAULT_EDGE_PROPS,
        },
        {
          id: 'when-leaf-1234-to-direct-1234',
          source: 'when-leaf-1234',
          target: 'direct-1234',
          ...DEFAULT_EDGE_PROPS,
        },
        {
          id: 'log-1234-to-direct-1234',
          source: 'log-1234',
          target: 'direct-1234',
          ...DEFAULT_EDGE_PROPS,
        },
      ]);
    });
  });
});
