import { dataToGraphology } from "../../graphology/graph";

const MAX_NUMBER_OF_AUTHORS = 20;

function getNodesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authors, id: publicationId, domains = [], title, year }) => {
    if (!authors) return [];
    return authors.reduce((acc, { person }) => {
      if (!person?.id) return acc;
      const { id: authorId, fullName: label } = person;
      const topics = domains.filter((domain) => domain.type === 'wikidata').reduce((a, { code, label }) => ({ ...a, [code]: { label: label.default.toLowerCase(), publicationId: publicationId } }), {});
      return [...acc, { id: authorId, attributes: { id: authorId, label, topics, publication: title?.default, year } }];
    }, []);
  });
}

function getEdgesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authors }) => {
    if (!authors) return [];
    const knownAuthors = authors.filter(({ person }) => person?.id).map(({ person }) => person.id);
    const coAuthorships = knownAuthors.flatMap(
      // Graphology undirected edges must be sorted, to avoid duplicated edges.
      (v, i) => knownAuthors.slice(i + 1).map((w) => (w < v ? { source: w, target: v } : { source: v, target: w })),
    );
    return coAuthorships;
  });
}

export function scanrToGraphology(publicationList) {

  console.log('Publications count : ', publicationList.length);

  const publicationListWithoutTooManyAuthors = publicationList.filter(({ authors = [] }) => authors.length <= MAX_NUMBER_OF_AUTHORS);
  const nodes = getNodesFromPublicationList(publicationListWithoutTooManyAuthors);
  const edges = getEdgesFromPublicationList(publicationListWithoutTooManyAuthors);

  return dataToGraphology(nodes, edges);
}