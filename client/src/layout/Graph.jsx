import '@react-sigma/core/lib/react-sigma.min.css';
import { Container, Col, Row, Alert, Button } from '@dataesr/react-dsfr';
import {
  ControlsContainer,
  FullScreenControl,
  SearchControl,
  SigmaContainer,
  useRegisterEvents,
  ZoomControl,
} from '@react-sigma/core';
// import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import { UndirectedGraph } from 'graphology';
import { useState, useEffect } from 'react';
import { VOSviewerOnline } from 'vosviewer-online';
import NodeProgramBorder from '../styles/rendering/node.border';
import EdgeProgramCurve from '../styles/rendering/edge.curve';
import NodePanel from './NodePanel';
import ClustersPanel from './ClustersPanel';
import AggClustersPanel from './AggClustersPanel';
import { groupBy } from '../utils/utils';
import { graphEncodeToJson } from '../utils/graphUtils';
import { DEFAULT_NODE_COLOR, getColormap, getPalette } from '../styles/colors';

const exportJson = (jsonString) => {
  const link = document.createElement('a');
  link.href = jsonString;
  link.download = 'graph.json';
  link.click();
};

function GraphEvents({ onNodeClick, onStageClick }) {
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    // Register the events
    registerEvents({
      // node events
      clickNode: (event) => {
        onNodeClick(event);
      },
      clickStage: (event) => {
        onStageClick(event);
      },
    });
  }, [onNodeClick, onStageClick, registerEvents]);

  return null;
}

const highlightGraph = (graph, selectedNode) => {
  graph.updateEachNodeAttributes(
    (node, attr) => ({
      ...attr,
      highlighted: node === selectedNode.id,
      label: node === selectedNode.id || graph.neighbors(selectedNode.id).includes(node) ? attr.label : null,
      color: node === selectedNode.id || graph.neighbors(selectedNode.id).includes(node) ? attr.color : DEFAULT_NODE_COLOR,
    }),
    { attributes: ['highlighted', 'color'] },
  );
  graph.updateEachEdgeAttributes(
    (edge, attr) => ({
      ...attr,
      hidden: !graph.extremities(edge).includes(selectedNode.id),
    }),
    { attributes: ['hidden'] },
  );
  return graph;
};

export default function Graph({ data, selectedGraph }) {
  console.log('data', data);
  const { publications, structures } = data;

  const [selectedNode, setSelectedNode] = useState(null);
  const [switchMode, enableSwitchMode] = useState(false);

  const graph = UndirectedGraph.from(data.graph[selectedGraph]);

  // Return alert if graph empty
  if (graph.order === 0) {
    return <Alert title="No results found" description="Your query returned no results" type="warning" closable />;
  }

  const communities = groupBy(data.graph[selectedGraph].nodes, ({ attributes }) => attributes.community);
  console.log('communities', communities);

  // Update nodes color
  const palette = getPalette(Object.keys(communities).length);
  const colormap = getColormap();
  graph.updateEachNodeAttributes(
    (node, attr) => ({
      ...attr,
      color: ((switchMode) ? colormap[colormap.length - 1 + (attr?.maxYear || 0) - 2023] : palette?.[attr.community]) || DEFAULT_NODE_COLOR,
      communityColor: palette?.[attr.community] || DEFAULT_NODE_COLOR,
    }),
    { attributes: ['color', 'communityColor'] },
  );

  return (
    <Container>
      <Row gutters>
        <Col>
          <Container fluid className="fr-my-3w">
            <Row gutters>
              <Col n="12">
                <SigmaContainer
                  style={{ height: '400px' }}
                  graph={selectedNode ? highlightGraph(graph, selectedNode) : graph}
                  settings={{ nodeProgramClasses: { border: NodeProgramBorder },
                    edgeProgramClasses: { curve: EdgeProgramCurve } }}
                >
                  <GraphEvents
                    onNodeClick={(event) => {
                      setSelectedNode({
                        id: event.node,
                        degree: graph.degree(event.node),
                        ...graph.getNodeAttributes(event.node),
                      });
                    }}
                    onStageClick={() => {
                      setSelectedNode(null);
                    }}
                  />
                  <ControlsContainer position="bottom-right">
                    <ZoomControl />
                    <FullScreenControl />
                    {/* <LayoutForceAtlas2Control settings={{ settings: { slowDown: 10 } }} /> */}
                  </ControlsContainer>
                  <ControlsContainer position="top-right">
                    <SearchControl style={{ width: '200px' }} />
                  </ControlsContainer>
                  <ControlsContainer position="bottom-left">
                    <div style={{ fontSize: 12 }}>
                    &nbsp;
                      {`Items: ${graph.order} | Links: ${graph.size} | Clusters: ${Object.keys(communities).length}`}
                    &nbsp;
                    </div>
                  </ControlsContainer>
                  <ControlsContainer position="top-left">
                    <Button size="sm" icon={(switchMode) ? 'ri-palette-line' : 'ri-palette-fill'} hasBorder={false} onClick={() => enableSwitchMode(!switchMode)}>
                      Last activity
                    </Button>
                  </ControlsContainer>
                </SigmaContainer>
              </Col>
              <Col n="12">
                <NodePanel selectedNode={selectedNode} graph={graph} publications={publications} />
              </Col>
            </Row>
          </Container>
        </Col>
        <Col>
          <div key={selectedGraph} style={{ height: '400px' }}>
            <VOSviewerOnline
              data={graphEncodeToJson(data.graph[selectedGraph])}
              parameters={{ attraction: 1, largest_component: false, simple_ui: true }}
            />
          </div>
        </Col>
      </Row>
      {(Object.keys(publications).length > 0)
        ? <ClustersPanel graph={graph} communities={communities} publications={publications} structures={structures} />
        : <AggClustersPanel graph={graph} communities={communities} />}
      <Button
        className="fr-btn fr-btn--tertiary fr-btn--icon-right fr-icon-download-line"
        onClick={() => exportJson(graphEncodeToJson(data.graph[selectedGraph]))}
      >
        Download graph
      </Button>
    </Container>
  );
}
