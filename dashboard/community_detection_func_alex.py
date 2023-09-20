import os
import requests

from dotenv import load_dotenv

import networkx as nx
from netgraph import Graph, InteractiveGraph
from pyvis.network import Network

import matplotlib
import matplotlib.pyplot as plt
import mpld3


def url_get_last(url: str) -> str:
    """Remove last segment of an url
    example : http://ww.test.com/TEST1
    --> returns TEST1
    """

    if not url:
        return None

    for split in reversed(url.rsplit("/")):
        if split:
            return split

    return None


def alex_get_url() -> str:
    """
    Returns:
        str: openalex api url
    """

    # Load server environment
    load_dotenv(os.path.dirname(os.path.dirname(__file__)) + "/server/.env")

    url = os.environ.get("OPENALEX_API_URL")
    print(os.path.dirname(os.path.dirname(__file__)))
    print(url)

    return url


def alex_get_thematic_url(url: str, thematic: list[str], cursor: str = None, per_page: int = 200) -> str:
    """Get thematic search url

    Args:
        url (str): api url
        thematic (list[str]): search thematic
        cursor (str, optional): search api cursor
        per_page (int, optional): number of results per page

    Returns:
        str: search url
    """
    if thematic:
        thematic = " AND ".join(thematic)
        url = url + "," if url[-1] != "," else url
        url += f"title.search:{thematic},abstract.search:{thematic}&mailto=bso@recherche.gouv.fr&cursor={cursor or ''}*&per_page={per_page}"
    return url


def alex_request_keywords(keywords: list[str], cursor: str = None) -> dict:
    """Get keywords search answer from api

    Args:
        keywords (list[str]): list of keywords / thematics

    Returns:
        dict: request answer from api
    """
    # Search url
    request_url = alex_get_thematic_url(alex_get_url(), keywords, cursor)
    print(request_url)

    # Request answer
    return requests.get(request_url).json()


def alex_get_results(search_type: str, args: list[str]) -> list[dict]:
    """Get search results from api

    Args:
        search_type: type of search
        args (list[str]): list of arguments

    Returns:
        list[dict]: list of answer from api
    """

    # Request answer
    answer = alex_request_keywords(args)
    results = [answer]

    print("first :", answer.get("meta"))

    while answer.get("meta").get("next_cursor"):
        answer = alex_request_keywords(args, cursor=answer.get("meta").get("next_cursor"))

        if answer.get("results"):
            results.append(answer)

        print("second: ", answer.get("meta"))

    return results


def alex_filter_results(results: list[dict], max_coauthors: int = 20) -> dict:
    """Get authors data from results

    Args:
        results (list[dict]): list of results
        max_coauthors (int, optional): max number of coauthors

    Returns:
        dict: authors data
    """

    # Init arrays
    nb_pub_removed = 0
    authors_data = {}
    wikidata_names = {}

    # Filter data
    # 1. Loop over works
    for json in results:
        for work in json.get("results"):
            work_id = url_get_last(work.get("id"))
            authorships = work.get("authorships")

            # 2. Loop over authors and remove publication if too many coauthors
            if len(authorships) > max_coauthors:
                print(f"{work.get('id')}: removing publication ({len(authorships)} authors)")
                nb_pub_removed += 1
                continue

            # 3. Get author information
            for authorship in authorships:
                author = authorship.get("author")
                author_id = url_get_last(author.get("id"))
                author_orcid = url_get_last(author.get("orcid"))
                author_name = author.get("display_name")

                # Add author
                author_data = {"name": author_name, "orcid": author_orcid}
                authors_data.setdefault(
                    author_id,
                    {"work_count": 0, "work_id": [], "coauthors": {}, "wikidata": {}},
                ).update(author_data)
                authors_data.get(author_id)["work_count"] += 1
                authors_data.get(author_id)["work_id"].append(work_id)

                # print(f"{author_name}: number of coauthors = {len(authorships) - 1}")

                # 4. Add coauthors information
                for coauthorship in authorships:
                    coauthor = coauthorship.get("author")
                    coauthor_id = url_get_last(coauthor.get("id"))
                    coauthor_name = coauthor.get("display_name")
                    if coauthor_id != author_id:
                        authors_data.get(author_id).get("coauthors").setdefault(coauthor_id, 0)
                        authors_data.get(author_id).get("coauthors")[coauthor_id] += 1

                # 5. Get wikidata topics information
                for concept in work.get("concepts"):
                    wikidata = url_get_last(concept.get("wikidata"))
                    wikidata_names.setdefault(wikidata, concept.get("display_name"))
                    authors_data.get(author_id).get("wikidata").setdefault(wikidata, 0)
                    authors_data.get(author_id).get("wikidata")[wikidata] += 1

    return authors_data
