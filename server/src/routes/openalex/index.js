import express from 'express';
import { makeQueryByKeywords, makeQueryByAuthors, makeQueryByStructures } from './make-query';
import { openAlexToGraphology, openAlexToPublications, openAlexToStructures } from './open-alex-to-data';

const MAX_NUMBER_OF_AUTHORS = 20;

const getQueryFunction = {
  keyword: makeQueryByKeywords,
  author: makeQueryByAuthors,
  structure: makeQueryByStructures,
};

const router = new express.Router();

router.route('/openalex').get(async (req, res) => {
  const {
    queries, type, condition, startyear, endyear, countries,
  } = req.query;
  const publicationList = await getQueryFunction[type]({ queries, condition, startyear, endyear, countries });

  console.log('Publications count : ', publicationList.length);

  const publicationListFiltered = publicationList.filter(
    ({ authors = [] }) => authors.length <= MAX_NUMBER_OF_AUTHORS,
  );

  const data = {
    graph: { main: openAlexToGraphology(publicationListFiltered) },
    publications: openAlexToPublications(publicationListFiltered),
    structures: openAlexToStructures(publicationListFiltered),
  };

  res.json(data);
});

export default router;
