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
    orcid_regex = "^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}$"

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
        case _:
            color = None

    return color
