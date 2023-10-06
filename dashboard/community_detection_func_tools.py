import requests
import xmltodict
import re


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


def id_get_type(id: str) -> str:
    """Check if id match with idref or orcid templates

    Args:
        id (str): author id

    Returns:
        str: id type (idref, orcid or None)
    """
    idref_regex = "^(idref)?[0-9]{9}$"
    orcid_regex = "^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$"

    # Check idref
    if re.search(idref_regex, id):
        id_type = "idref"
    # Check orcid
    elif re.search(orcid_regex, id):
        id_type = "orcid"
    else:
        id_type = None

    return id_type

    # id = id[len("idref")] if id.startswith("idref") else id


def idref_get(idref: str) -> dict:
    """Use idref api to get author json info

    Args:
        idref: author idref

    Returns:
        author json data
    """
    if idref is None:
        return None

    idref_url = f"https://www.idref.fr/{idref}.xml"
    idref_xml = requests.get(idref_url).text

    if "HTTP Status 404" in idref_xml:
        print(f"{idref}: bad idref")
        return None

    idref_answer = xmltodict.parse(idref_xml, attr_prefix="")
    print("answer :", idref_answer)

    return idref_answer


def idref_find_orcid(idref_answer: dict) -> str:
    """This function check author idref data and try to find an ORCID.
    Returns None if no ORCID found.

    Args:
        idref_answer: author json data

    Returns:
        ORCID
    """
    orcid = None
    found = False

    if idref_answer is None:
        return orcid

    idref_data = idref_answer.get("record").get("datafield")

    for subid in range(len(idref_data)):
        subfield = idref_data[subid].get("subfield")

        if not isinstance(subfield, list):
            continue

        for elem in subfield:
            if isinstance(elem, dict):
                elem = elem.get("#text")  # if xml parser
            if elem == "ORCID":
                found = True
                break

        if found:
            for elem in subfield:
                if isinstance(elem, dict):
                    elem = elem.get("#text")  # if xml parser
                if type(elem) is str and id_get_type(elem) == "orcid":
                    orcid = elem
                    break

        if orcid:
            break

    return orcid


def tag_get_color(tag: str) -> str:
    """Get color associated to a tag

    Args:
        tag (str): tag

    Returns:
        str: hexa color
    """
    match tag:
        case "keyword":
            color = "#6dc9f1"
        case "idref":
            color = "#4FD868"
        case "orcid":
            color = "#F1C232"
        case "bad_id":
            color = "#eb4034"
        case _:
            color = None

    return color


def max_from_dicts(x: dict):
    """Get max value from dicts"""
    concat = {}
    for serie in x:
        for elem in serie:
            if elem in concat:
                concat[elem] += serie[elem]
            else:
                concat[elem] = serie[elem]
    if concat:
        return max(concat, key=concat.get)
    else:
        return None


def count_from_dicts(x: dict, count=None):
    """Get count from dicts"""
    concat = {}
    for serie in x:
        for elem in serie:
            concat.update({elem: serie[elem]})
    if concat:
        if count:
            return sum(x == count for x in concat.values())
        else:
            return len(concat)
    else:
        return None
