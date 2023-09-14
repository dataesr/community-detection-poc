import streamlit as st
from streamlit.components.v1 import html
import os
import sys
import networkx as nx
from dotenv import load_dotenv
from community_detection_func import graph_generate

st.title("Community detection application")

# Choose data source
data_sources = ["scanR"]
data_source = st.selectbox("Data source", data_sources, 0)

# Choose search by
search_types = ["Co-authoring by keyword", "Co-authoring by author id (idref)"]
search_by = st.selectbox("Search by", search_types, 0)

# Choose query
query_label = "Keywords" if (search_types.index(search_by) == 0) else "Idrefs"
queries = st.text_input(query_label)

# Settings
with st.sidebar:
    setting_max_coauthors = st.slider("Max coauthors", 0, 100, 20)
    setting_min_publications = st.slider("Min publications", 0, 10, 5)
    setting_enable_communities = st.toggle("Enable communities", True)
    setting_detection_algo = st.selectbox("Detection algorithm", ("Louvain", "Girvan-Newman", "CPM"))
    setting_visualizer = st.selectbox("Graph visualizer", ("Matplotlib", "Pyvis"))

# Generate graph
if st.button(label="Generate graph", type="primary") is True:
    graph_html, request, answer = graph_generate(
        data_source,
        search_types.index(search_by),
        queries,
        setting_max_coauthors,
        setting_min_publications,
        setting_enable_communities,
        setting_detection_algo,
        setting_visualizer,
    )

    with st.expander("See request infos"):
        st.markdown("Request :")
        st.json(request, expanded=False)

        st.markdown("Answer :")
        st.json(answer, expanded=False)

    # Display graph
    st.markdown("Graph : ")
    HtmlFile = open(graph_html, "r", encoding="utf-8")
    html(HtmlFile.read(), height=600, scrolling=True)

    st.balloons()
