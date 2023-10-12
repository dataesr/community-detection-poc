import '@react-sigma/core/lib/react-sigma.min.css';
import { Badge, BadgeGroup, Col, Row, Title, Accordion, AccordionItem } from '@dataesr/react-dsfr';
import { getThematicFromCluster, getPublicationAttributes } from '../utils/utils';

export default function NodePanel({ selectedNode, graph, data }) {
  if (!selectedNode) return null;

  return (
    <div className="fr-card fr-card--shadow">
      <div className="fr-my-2w fr-card__body">
        <Title look="h6" as="p" className="fr-mb-1v">
          {selectedNode.label}
        </Title>
        <BadgeGroup className="fr-mt-1w">
          <Badge colorFamily="yellow-tournesol" text={`${selectedNode.id}`} />
          <Badge
            colorFamily="orange-terre-battue"
            text={`Last publication: ${Math.max(
              ...graph
                .getNodeAttribute(selectedNode.id, 'publications')
                ?.map((publicationId) => getPublicationAttributes(data, publicationId, 'year')),
            )}`}
          />
        </BadgeGroup>
        <Accordion className="fr-mt-1w">
          <AccordionItem title={`${selectedNode.degree} co-authors`}>
            {graph.mapNeighbors(selectedNode.id, (node, attr) => attr.name).join(', ')}
          </AccordionItem>
          <AccordionItem title={`${selectedNode.weight} publications`}>
            {graph.getNodeAttribute(selectedNode.id, 'publications')?.map((publicationId) => (
              <p>{getPublicationAttributes(data, publicationId, 'title')}</p>
            ))}
          </AccordionItem>
        </Accordion>
        <BadgeGroup className="fr-mt-2w">
          {getThematicFromCluster([graph.getNodeAttributes(selectedNode.id)])?.map((topic) => (
            <Badge type="info" text={`${topic.label} (${topic.publicationIds.length})`} />
          ))}
        </BadgeGroup>
      </div>
    </div>
  );
}
