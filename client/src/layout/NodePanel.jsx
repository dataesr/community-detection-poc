import '@react-sigma/core/lib/react-sigma.min.css';
import { Badge, BadgeGroup, Title, Accordion, AccordionItem, Container } from '@dataesr/react-dsfr';
import { GetColorName } from 'hex-color-to-color-name';
import { publicationsGetTopicsCount } from '../utils/publicationUtils';

export default function NodePanel({ selectedNode, graph, publications }) {
  if (!selectedNode || !graph.order) return null;

  return (
    <div className="fr-card fr-card--shadow">
      <div className="fr-my-2w fr-card__body">
        <Title as="h6" className="fr-mb-1v">
          {selectedNode.name}
        </Title>
        <Container>
          <BadgeGroup className="fr-mt-1w">
            <Badge colorFamily="yellow-tournesol" text={`${selectedNode.id}`} />
            <Badge
              colorFamily="orange-terre-battue"
              text={`Last publication: ${Object.keys(selectedNode?.years || {}) ?? Math.max(
                ...graph.getNodeAttribute(selectedNode.id, 'publications').map((publicationId) => publications[publicationId].year),
              )}`}
            />
            <Badge
              colorFamily="blue-cumulus"
              text={`Community ${GetColorName(selectedNode.communityColor)} (${selectedNode.community})`}
            />
          </BadgeGroup>
          <Accordion className="fr-mt-1w">
            <AccordionItem title={`${selectedNode.degree} co-authors`}>
              {graph.mapNeighbors(selectedNode.id, (node, attr) => attr.label).join(', ')}
            </AccordionItem>
            <AccordionItem title={`${selectedNode.weight} publications`}>
              {graph.getNodeAttribute(selectedNode.id, 'publications')?.map((publicationId) => (
                <p>{publications[publicationId]?.title}</p>
              ))}
            </AccordionItem>
            {(selectedNode.domains && (
              <AccordionItem title={`${Object.keys(selectedNode.domains).length} domains`}>
                {Object.entries(selectedNode.domains).map((item) => (
                  <p key={item[0]}>{`${item[0]} (${item[1]})`}</p>
                ))}
              </AccordionItem>
            ))}
          </Accordion>
          {(publications && selectedNode.publicationsIds
          && (
            <BadgeGroup className="fr-mt-2w">
              {publicationsGetTopicsCount(publications, graph.getNodeAttribute(selectedNode.id, 'publications'), 10)
                .map((topic) => <Badge type="info" text={`${topic[0]} (${topic[1]})`} />)}
            </BadgeGroup>
          )
          )}
        </Container>
      </div>
    </div>
  );
}
