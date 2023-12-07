import '@react-sigma/core/lib/react-sigma.min.css';
import { Container, Col, Row, Alert, Radio, RadioGroup } from '@dataesr/react-dsfr';
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
import NodePanel from './NodePanel';
import ClustersPanel from './ClustersPanel';
import { groupBy } from '../utils/graphUtils';
import { DEFAULT_NODE_COLOR, COMMUNTIY_COLORS } from '../styles/colors';

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
      label: node === selectedNode.id || graph.neighbors(selectedNode.id).includes(node) ? attr.label : '',
      color: node === selectedNode.id || graph.neighbors(selectedNode.id).includes(node) ? attr.color : '#E2E2E2',
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

export default function Graph({ data }) {
  console.log('data', data);

  const graphOptions = Object.keys(data.graph);
  const { publications, structures } = data;

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedOption, setSelectedOption] = useState(graphOptions[0]);

  const graph = UndirectedGraph.from(data.graph[selectedOption]);

  // Return alert if graph empty
  if (graph.order === 0) {
    return <Alert title="No results found" description="Your query returned no results" type="warning" closable />;
  }

  const communities = groupBy(data.graph[selectedOption].nodes, ({ attributes }) => attributes.community);
  // console.log('communities', communities);

  // Update nodes color
  graph.updateEachNodeAttributes(
    (node, attr) => ({
      ...attr,
      color: COMMUNTIY_COLORS?.[attr.community] || DEFAULT_NODE_COLOR,
    }),
    { attributes: ['color'] },
  );

  return (
    <Container fluid className="fr-my-3w">
      {(graphOptions.length > 1) && (
        <RadioGroup
          isInline
          label={selectedOption}
        >
          {graphOptions.map((option) => (
            <Radio
              label={option}
              value={option}
              defaultChecked={option === selectedOption}
              onChange={(event) => setSelectedOption(event.target.value)}
            />
          ))}
        </RadioGroup>
      )}
      <Row gutters>
        <Col n="12">
          <SigmaContainer
            style={{ height: '500px' }}
            graph={selectedNode ? highlightGraph(graph, selectedNode) : graph}
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
          </SigmaContainer>
        </Col>
        <Col n="12">
          <NodePanel selectedNode={selectedNode} graph={graph} publications={publications} />
        </Col>
      </Row>
      <ClustersPanel graph={graph} communities={communities} publications={publications} structures={structures} />
    </Container>
  );
}
