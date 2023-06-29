import express from 'express';
import { scanrToGraphology } from './scanr-to-graphology';
import { makeQueryByAuthor, makeQueryByKeyword, makeQueryByStructure } from './make-query';
import config from '../../config';

const getQueryFunction = {
  author: makeQueryByAuthor,
  keyword: makeQueryByKeyword,
  structure: makeQueryByStructure,
};

const router = new express.Router();

router.route('/scanr')
  .get(async (req, res) => {
    const { query, type } = req.query;
    const body = getQueryFunction[type](query);
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
    // console.log(data[0].keywords.default)
    const graph = scanrToGraphology(data);
    res.json(graph);
  });

export default router;
