import express, { response } from 'express';
import { scanrToGraphology } from './scanr-to-graphology';
import { makeQueryByKeywords, makeQueryByAuthors, makeQueryByStructures } from './make-query';
import config from '../../config';

const getQueryFunction = {
  keyword: makeQueryByKeywords,
  author: makeQueryByAuthors,
  structure: makeQueryByStructures,
};

const router = new express.Router();

router.route('/scanr')
  .get(async (req, res) => {
    const { queries, type, condition, startyear, endyear } = req.query;
    const body = getQueryFunction[type](queries, condition, startyear, endyear);
    console.log("%j", body)
    const data = await fetch(
      `${config.scanr.apiUrl}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { Authorization: config.scanr.apiToken, 'Content-Type': 'application/json' },
      },
    )
      .then((response) => response.json())
      .then(({ hits }) => hits?.hits?.map(({ _source }) => _source));
    const graph = scanrToGraphology(data);
    res.json(graph);
  });

export default router;
