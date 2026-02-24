const customStyles = {
  table: {
    style: {
      backgroundColor: "transparent",
    },
  },

  headRow: {
    style: {
      backgroundColor: "var(--table-header-bg)",
      borderBottom: "1px solid var(--table-border)",
      minHeight: "45px",
    },
  },

  headCells: {
    style: {
      color: "var(--table-header-text)",
      fontWeight: 600,
      fontSize: "13px",
    },
  },

  rows: {
    style: {
      backgroundColor: "var(--table-row-bg)",
      color: "var(--table-row-text)",
      borderBottom: "1px solid var(--table-border)",
      minHeight: "48px",
    },
    highlightOnHoverStyle: {
      backgroundColor: "var(--table-row-hover)",
      transition: "all 0.2s ease",
    },
  },

  pagination: {
    style: {
      backgroundColor: "var(--table-pagination-bg)",
      color: "var(--table-row-text)",
      borderTop: "1px solid var(--table-border)",
    },
  },
};

export default customStyles;