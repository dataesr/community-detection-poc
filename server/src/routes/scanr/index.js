import express from 'express';
import { scanrToGraphology, scanrToPublications, scanrToStructures } from './scanr-to-data';
import { makeQueryByKeywords, makeQueryByAuthors, makeQueryByStructures } from './make-query';
import config from '../../config';

const MAX_NUMBER_OF_AUTHORS = 20;

const getQueryFunction = {
  keyword: makeQueryByKeywords,
  author: makeQueryByAuthors,
  structure: makeQueryByStructures,
};

const router = new express.Router();

router.route('/scanr').get(async (req, res) => {
  const { queries, type, condition, startyear, endyear } = req.query;
  const body = getQueryFunction[type](queries, condition, startyear, endyear);
  console.log('scanr body', JSON.stringify(body));
  const publicationList = await fetch(`${config.scanr.apiUrl}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: config.scanr.apiToken, 'Content-Type': 'application/json' },
  })
    .then((response) => response.json())
    .then(({ hits }) => hits?.hits?.map(({ _source }) => _source));

  console.log('Publications count : ', publicationList.length);

  const publicationListFiltered = publicationList.filter(
    ({ authors = [] }) => authors.length <= MAX_NUMBER_OF_AUTHORS,
  );

  const data = {
    graph: { main: scanrToGraphology(publicationListFiltered) },
    publications: scanrToPublications(publicationListFiltered),
    structures: scanrToStructures(publicationListFiltered),
  };

  res.json(data);
});

export default router;
