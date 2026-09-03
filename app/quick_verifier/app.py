import streamlit as st
import pandas as pd

from verifier import quick_verify_dataframe

st.set_page_config(page_title="Quick Lead Verifier", layout="centered")
st.title("🛠️ Quick CSV Email Verifier")
st.write("Fast, local verification: Column cleanup, Syntax, Junk domains, and DNS MX checks.")

uploaded_file = st.file_uploader("Upload your CSV file", type=["csv"])

if uploaded_file:
    df = pd.read_csv(uploaded_file)
    st.write("### Original Data Preview")
    st.dataframe(df.head(3))

    if st.button("Start Quick Verification", type="primary"):
        progress_bar = st.progress(0)
        status_text = st.empty()

        def on_progress(current: int, total: int) -> None:
            progress_bar.progress(current / total)
            status_text.text(f"Processing row {current} of {total}...")

        try:
            result = quick_verify_dataframe(df, on_progress=on_progress)
        except ValueError as exc:
            st.error(str(exc))
            st.stop()

        if result.dropped_email_columns:
            st.info(
                f"🗑️ Dropped extra email columns: {', '.join(result.dropped_email_columns)}. "
                f"Kept '{result.email_column}'."
            )
        else:
            st.info(f"✅ Found primary email column: '{result.email_column}'.")

        st.success("Verification Complete!")

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Processed", result.total_processed)
        col2.metric("Bad Format", result.format_errors)
        col3.metric("Garbage Domain", result.garbage_domains)
        col4.metric("Dead DNS (No MX)", result.dns_errors)

        st.write(f"### Clean Data Preview ({len(result.clean_df)} Valid Leads)")
        st.dataframe(result.clean_df.head(5))

        if not result.clean_df.empty:
            csv_data = result.clean_df.to_csv(index=False).encode("utf-8")
            st.download_button(
                label="📥 Download Cleaned CSV",
                data=csv_data,
                file_name="locally_verified_leads.csv",
                mime="text/csv",
            )
