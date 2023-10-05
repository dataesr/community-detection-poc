import requests
from community_detection_func_tools import url_get_last


def alex_url() -> str:
    """
    Returns:
        str: openalex base url
    """
    return "https://api.openalex.org/"


def alex_get_thematic_url(
    thematic: list[str],
    start_year: int = 2018,
    end_year: int = None,
    and_condition: bool = True,
    countries: list[str] = None,
    cursor: str = None,
    per_page: int = 200,
) -> str:
    """Get thematic search url

    Args:
        thematic (list[str]): search thematic
        start_year (int): search start year
        end_year (int): search end year
        and_condition (bool, optional): filter condition and (true = AND, false = OR)
        countries (list[str], optional): list of country codes
        cursor (str, optional): search api cursor
        per_page (int, optional): number of results per page

    Returns:
        str: search url
    """
    if thematic:
        # Base url
        url = alex_url()

        # Search works
        condition = "AND" if and_condition else "OR"
        thematic = f" {condition} ".join(thematic) if isinstance(thematic, list) else thematic
        url += f"works?search={thematic}"

        # Filter search
        url += f"&filter=publication_year:{start_year}-{end_year or ''},is_paratext:false"
        if countries:
            countries = " AND ".join(countries)
            url += f",institutions.country_code:{countries}"

        # Add cursor and number of results per page
        url += f"&cursor={cursor or ''}*&per_page={per_page}"

        # Add email for performance
        url += "&mailto=bso@recherche.gouv.fr"

    else:
        raise ValueError("Search keywords are empty!")

    return url


def alex_get_authors_url(
    authors: list[str],
    start_year: int = 2018,
    end_year: int = None,
    countries: list[str] = None,
    cursor: str = None,
    per_page: int = 200,
    and_condition: bool = True,
) -> str:
    """Get authors search url

    Args:
        authors (list[str]): authors ids
        start_year (int): search start year
        end_year (int): search end year
        countries: list of country codes
        cursor (str, optional): search api cursor
        per_page (int, optional): number of results per page
        and_condition (bool, optional): filter condition and (true = AND, false = OR)

    Returns:
        str: openalex search url
    """
    if authors:
        # Base url
        url = alex_url() + "works?"

        # Filter search
        authors = f"{'+' if and_condition else '|'}".join(authors)  # Logical expression
        url += f"&filter=author.orcid:{authors}"
        url += f",publication_year:{start_year}-{end_year or ''},is_paratext:false"
        if countries:
            countries = " AND ".join(countries)
            url += f",institutions.country_code:{countries}"

        # Add cursor and number of results per page
        url += f"&cursor={cursor or ''}*&per_page={per_page}"

        # Add email for performance
        url += "&mailto=bso@recherche.gouv.fr"

    else:
        raise ValueError("Authors ids are empty!")

    return url


def alex_get_structures_url(
    structures: list[str],
    start_year: int = 2018,
    end_year: int = None,
    cursor: str = None,
    per_page: int = 200,
    and_condition: bool = True,
) -> str:
    """Get authors search url

    Args:
        structures (list[str]): structures ids
        start_year (int): search start year
        end_year (int): search end year
        cursor (str, optional): search api cursor
        per_page (int, optional): number of results per page
        and_condition (bool, optional): filter condition and (true = AND, false = OR)

    Returns:
        str: openalex search url
    """
    if structures:
        # Base url
        url = alex_url() + "works?"

        # Filter search
        structures = f"{'+' if and_condition else '|'}".join(structures)  # Logical expression
        url += f"&filter=institutions.ror:{structures}"
        url += f",publication_year:{start_year}-{end_year or ''},is_paratext:false"

        # Add cursor and number of results per page
        url += f"&cursor={cursor or ''}*&per_page={per_page}"

        # Add email for performance
        url += "&mailto=bso@recherche.gouv.fr"

    else:
        raise ValueError("Authors ids are empty!")

    return url


def alex_request_keywords(keywords: list[str], filters: dict, cursor: str = None) -> dict:
    """Get keywords search answer from api

    Args:
        keywords (list[str]): list of keywords / thematics
        filters (dict): search filters
        cursor (str, optional): search results cursor

    Returns:
        dict: request answer from api
    """

    # Search url
    request_url = alex_get_thematic_url(
        keywords,
        start_year=filters.get("start_year"),
        end_year=filters.get("end_year"),
        and_condition=filters.get("and_condition"),
        cursor=cursor,
    )
    print(request_url)

    # Request answer
    return requests.get(request_url).json()


def alex_request_authors(ids: list[str], filters: dict, cursor: str = None) -> dict:
    """Get authors id search answer from api

    Args:
        ids (list[str]): list of authors ids (orcid)
        filters (dict): search filters
        cursor (str, optional): search results cursor

    Returns:
        dict: request answer from api
    """

    # Search url
    request_url = alex_get_authors_url(
        ids,
        start_year=filters.get("start_year"),
        end_year=filters.get("end_year"),
        and_condition=filters.get("and_condition"),
        cursor=cursor,
    )
    print(request_url)

    # Request answer
    return requests.get(request_url).json()


def alex_request_structures(ids: list[str], filters: dict, cursor: str = None) -> dict:
    """Get structures id search answer from api

    Args:
        ids (list[str]): list of structures ids (ror)
        filters (dict): search filters
        cursor (str, optional): search results cursor

    Returns:
        dict: request answer from api
    """

    # Search url
    request_url = alex_get_structures_url(
        ids,
        start_year=filters.get("start_year"),
        end_year=filters.get("end_year"),
        and_condition=filters.get("and_condition"),
        cursor=cursor,
    )
    print(request_url)

    # Request answer
    return requests.get(request_url).json()


def alex_request(search_type: str, args: list[str], filters: dict, cursor=None) -> dict:
    """Get request according to search type

    Args:
        search_type (str): type of search
        args (list[str]): list of arguments
        filters (dict): search filters
        cursor (str, optional): search results cursor

    Returns:
        dict: request answer from api
    """

    match search_type:
        case 0:
            # Keywords
            answer = alex_request_keywords(args, filters, cursor=cursor)
        case 1:
            # Authors
            answer = alex_request_authors(args, filters, cursor=cursor)
        case 2:
            # Structures
            answer = alex_request_structures(args, filters, cursor=cursor)
        case _:
            answer = None
            raise ValueError("Incorrect search type")

    return answer


def alex_get_results(search_type: str, args: list[str], filters: dict) -> list[dict]:
    """Get search results from api

    Args:
        search_type: type of search
        args (list[str]): list of arguments
        filters (dict): search filters

    Returns:
        list[dict]: list of answer from api
    """

    # Request answer
    answer = alex_request(search_type, args, filters)
    results = [answer]

    while answer.get("meta").get("next_cursor") and len(results) < 5:  # @TODO Find better solution for large results
        answer = alex_request(search_type, args, filters, cursor=answer.get("meta").get("next_cursor"))

        if answer.get("results"):
            results.append(answer)

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

                # 6. Get published years
                year = work.get("publication_year")
                if year:
                    authors_data.get(author_id).setdefault("years", [])
                    authors_data.get(author_id)["years"].append(int(year))

    return authors_data
