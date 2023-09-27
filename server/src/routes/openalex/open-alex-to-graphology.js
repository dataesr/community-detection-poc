import { dataToGraphology } from '../../graphology/graph';

const MAX_NUMBER_OF_AUTHORS = 20;

function getNodesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authorships, id: publicationId, concepts = [], title }) => {
    if (!authorships) return [];
    return authorships.reduce((acc, { author }) => {
      if (!author?.id) return acc;
      const { id: authorId, display_name: label } = author;
      const topics = concepts.filter((concept) => concept?.wikidata).reduce((a, { id, display_name }) => ({ ...a, [id]: { label: display_name.toLowerCase(), publicationId: publicationId } }), {});
      return [...acc, { id: authorId, attributes: { id: authorId, label, topics, publication: title } }];
    }, []);
  });
}

function getEdgesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authorships }) => {
    if (!authorships) return [];
    const knownAuthors = authorships.filter(({ author }) => author?.id).map(({ author }) => author.id);
    const coAuthorships = knownAuthors.flatMap(
      // Graphology undirected edges must be sorted, to avoid duplicated edges.
      (v, i) => knownAuthors.slice(i + 1).map((w) => (w < v ? { source: w, target: v } : { source: v, target: w })),
    );
    return coAuthorships;
  });
}

export function openAlexToGraphology(publicationList) {

  console.log('Publications count : ', publicationList.length);

  const publicationListWithoutTooManyAuthors = publicationList.filter(({ authors = [] }) => authors.length <= MAX_NUMBER_OF_AUTHORS);
  const nodes = getNodesFromPublicationList(publicationListWithoutTooManyAuthors);
  const edges = getEdgesFromPublicationList(publicationListWithoutTooManyAuthors);

  // Create graph 
  return dataToGraphology(nodes, edges);
}
