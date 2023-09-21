import streamlit as st
from streamlit.components.v1 import html
from annotated_text import annotated_text
from community_detection_func_graph import graph_generate
from community_detection_func_tools import id_get_type, tag_get_color

st.title("Community detection application")

# Choose data source
data_sources = ["scanR", "OpenAlex"]
data_source = st.selectbox("Data source", data_sources, 0)

# Choose search by
search_types = ["Co-authoring by keywords", "Co-authoring by authors ids"]
search_by = st.selectbox("Search by", search_types, 0)

# Choose query
match search_types.index(search_by):
    case 0:
        # Keywords
        queries = st.text_input("Keywords")
        queries = [query.strip() for query in queries.split(",")]
        print(queries)
        annotated_text([(query, "", tag_get_color("keyword")) for query in queries if query])
    case 1:
        # Authors ids
        queries = st.text_input("Authors ids")
        queries = [query.strip() for query in queries.split(",")]
        print(queries)

        annotated_text(
            [
                (query, id_get_type(query) or "", tag_get_color(id_get_type(query)) or "#eb4034")
                for query in queries
                if query
            ]
        )

    case _:
        raise ValueError("Incorrect search type")

# Settings
with st.sidebar:
    setting_max_coauthors = st.slider("Max coauthors", 0, 100, 20)
    setting_min_publications = st.slider("Min publications", 0, 10, 0) or None
    setting_enable_communities = st.toggle("Enable communities", True)
    setting_detection_algo = st.selectbox("Detection algorithm", ("Louvain", "Girvan-Newman", "CPM"))
    setting_visualizer = st.selectbox("Graph visualizer", ("Matplotlib", "Pyvis"))

# Generate graph
if st.button(label="Generate graph", type="primary") is True:
    graph_html, authors_data = graph_generate(
        data_source,
        search_types.index(search_by),
        queries,
        setting_max_coauthors,
        setting_min_publications,
        setting_enable_communities,
        setting_detection_algo,
        setting_visualizer,
    )

    with st.expander("See authors data"):
        st.json(authors_data, expanded=True)

    # Display graph
    st.markdown("Graph : ")
    HtmlFile = open(graph_html, "r", encoding="utf-8")
    html(HtmlFile.read(), height=600, scrolling=True)

    st.balloons()
