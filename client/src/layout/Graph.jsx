import "@react-sigma/core/lib/react-sigma.min.css";
import { Container, Col, Row, Alert } from "@dataesr/react-dsfr";
import {
  ControlsContainer,
  FullScreenControl,
  SearchControl,
  SigmaContainer,
  useRegisterEvents,
  ZoomControl,
} from "@react-sigma/core";
import { LayoutForceAtlas2Control } from "@react-sigma/layout-forceatlas2";
import { UndirectedGraph } from "graphology";
import { useState, useEffect } from "react";
import NodePanel from "./NodePanel";
import ClustersPanel from "./ClustersPanel";
import { DEFAULT_NODE_COLOR, COMMUNTIY_COLORS } from "../styles/colors";

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
    (node, attr) => {
      return {
        ...attr,
        highlighted: node === selectedNode.id ? true : false,
        color: node === selectedNode.id || graph.neighbors(selectedNode.id).includes(node) ? attr.color : "#E2E2E2",
      };
    },
    { attributes: ["highlighted", "color"] }
  );
  graph.updateEachEdgeAttributes(
    (edge, attr) => {
      return {
        ...attr,
        hidden: graph.extremities(edge).includes(selectedNode.id) ? false : true,
      };
    },
    { attributes: ["hidden"] }
  );
  return graph;
};

export default function Graph({ data }) {
  console.log(data);
  const [selectedNode, setSelectedNode] = useState(null);
  const graph = UndirectedGraph.from(data.graph);

  // Return alert if graph empty
  if (graph.order == 0) {
    return <Alert title="No results found" description="Your query returned no results" type="warning" closable />;
  }

  // Fill communities
  // const communities = graph.reduceNodes((acc, node, attr) => {
  //   const { label, size, community, topics, weight } = attr;
  //   if (!acc[community]) {
  //     acc[community] = [{ id: node, label, size, degree: graph.degree(node), topics, weight }];
  //   } else {
  //     acc[community] = [...acc[community], { id: node, label, size, degree: graph.degree(node), topics, weight }].sort(
  //       (a, b) => b.size - a.size
  //     );
  //   }
  //   return acc;
  // }, {});
  // const clustersKeys = Object.keys(communities)
  //   .sort((a, b) => communities[b].length - communities[a].length)
  //   .slice(0, 6);

  // Update community colors
  graph.updateEachNodeAttributes(
    (node, attr) => {
      return {
        ...attr,
        color: COMMUNTIY_COLORS?.[attr.community] || DEFAULT_NODE_COLOR,
      };
    },
    { attributes: ["color"] }
  );

  return (
    <>
      <Container fluid className="fr-my-3w">
        <Row gutters>
          <Col n="12">
            <SigmaContainer
              style={{ height: "500px" }}
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
                <SearchControl style={{ width: "200px" }} />
              </ControlsContainer>
            </SigmaContainer>
          </Col>
          <Col n="12">
            <NodePanel selectedNode={selectedNode} graph={graph} data={data} />
          </Col>
        </Row>
        <ClustersPanel graph={graph} data={data} />
      </Container>
    </>
  );
}
