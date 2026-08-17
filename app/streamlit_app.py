import streamlit as st
import requests
import time

# API Configuration
API_URL = "http://localhost:8000"

st.set_page_config(page_title="DocuRAG", page_icon="📄", layout="wide")

st.title("📄 DocuRAG — AI Document Q&A")
st.markdown("Upload a PDF document and ask questions about its content.")

# Sidebar for document upload
with st.sidebar:
    st.header("Document Upload")
    uploaded_file = st.file_uploader("Choose a PDF file", type=["pdf"])
    
    if st.button("Upload & Process") and uploaded_file is not None:
        with st.spinner("Processing document... This may take a moment."):
            # Call backend API
            files = {"file": (uploaded_file.name, uploaded_file.getvalue(), "application/pdf")}
            try:
                response = requests.post(f"{API_URL}/documents/upload", files=files)
                if response.status_code == 200:
                    data = response.json()
                    st.success(f"Successfully processed! Extracted {data['chunks']} chunks.")
                else:
                    st.error(f"Failed to upload: {response.text}")
            except requests.exceptions.ConnectionError:
                st.error("Cannot connect to backend server. Make sure FastAPI is running on port 8000.")

# Main area for chatting
st.header("Ask a Question")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "sources" in message and message["sources"]:
            st.markdown("**Sources:**")
            for source in message["sources"]:
                st.markdown(f"- `{source['filename']}` (Page {source['page']})")

# Chat input
if prompt := st.chat_input("What would you like to know?"):
    # Display user message
    st.chat_message("user").markdown(prompt)
    
    # Add user message to state
    st.session_state.messages.append({"role": "user", "content": prompt})
    
    # Process query
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        message_placeholder.markdown("Thinking...")
        
        try:
            start_time = time.time()
            response = requests.post(
                f"{API_URL}/query", 
                json={"question": prompt}
            )
            
            if response.status_code == 200:
                data = response.json()
                answer = data["answer"]
                sources = data["sources"]
                
                # Display answer
                message_placeholder.markdown(answer)
                
                # Display sources
                if sources:
                    st.markdown("**Sources:**")
                    for source in sources:
                        st.markdown(f"- `{source['filename']}` (Page {source['page']})")
                        
                # Add to history
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": answer,
                    "sources": sources
                })
            else:
                error_msg = f"Error: {response.text}"
                message_placeholder.error(error_msg)
                st.session_state.messages.append({"role": "assistant", "content": error_msg})
                
        except requests.exceptions.ConnectionError:
            error_msg = "Cannot connect to backend server. Make sure FastAPI is running on port 8000."
            message_placeholder.error(error_msg)
            st.session_state.messages.append({"role": "assistant", "content": error_msg})
