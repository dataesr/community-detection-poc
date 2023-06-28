import express from 'express';
import { scanrToGraphology } from './scanr-to-graphology';
import { makeQuery } from './make-query';
import config from '../../config';

const router = new express.Router();

router.route('/scanr')
  .get(async (req, res) => {
    const { query } = req.query;
    const body = makeQuery(query);
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
    console.log(data[0].keywords.default)
    const graph = scanrToGraphology(data);
    res.json(graph);

  });

export default router;
