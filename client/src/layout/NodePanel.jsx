import '@react-sigma/core/lib/react-sigma.min.css';
import { Badge, BadgeGroup, Title, Accordion, AccordionItem } from '@dataesr/react-dsfr';
import { GetColorName } from 'hex-color-to-color-name';
import { publicationsGetTopicsCount } from '../utils/publicationUtils';
import { COMMUNTIY_COLORS } from '../styles/colors';

export default function NodePanel({ selectedNode, graph, publications }) {
  if (!selectedNode) return null;

  return (
    <div className="fr-card fr-card--shadow">
      <div className="fr-my-2w fr-card__body">
        <Title look="h6" as="p" className="fr-mb-1v">
          {selectedNode.name}
        </Title>
        <BadgeGroup className="fr-mt-1w">
          <Badge colorFamily="yellow-tournesol" text={`${selectedNode.id}`} />
          <Badge
            colorFamily="orange-terre-battue"
            text={`Last publication: ${Math.max(
              ...graph.getNodeAttribute(selectedNode.id, 'publications').map((publicationId) => publications[publicationId].year),
            )}`}
          />
          <Badge
            colorFamily="blue-cumulus"
            text={`Community ${GetColorName(COMMUNTIY_COLORS[selectedNode.community])} (${selectedNode.community})`}
          />
        </BadgeGroup>
        <Accordion className="fr-mt-1w">
          <AccordionItem title={`${selectedNode.degree} co-authors`}>
            {graph.mapNeighbors(selectedNode.id, (node, attr) => attr.name).join(', ')}
          </AccordionItem>
          <AccordionItem title={`${selectedNode.weight} publications`}>
            {graph.getNodeAttribute(selectedNode.id, 'publications').map((publicationId) => (
              <p>{publications[publicationId]?.title}</p>
            ))}
          </AccordionItem>
        </Accordion>
        <BadgeGroup className="fr-mt-2w">
          {publicationsGetTopicsCount(publications, graph.getNodeAttribute(selectedNode.id, 'publications'), 10)
            .map((topic) => <Badge type="info" text={`${topic[0]} (${topic[1]})`} />)}
        </BadgeGroup>
      </div>
    </div>
  );
}
