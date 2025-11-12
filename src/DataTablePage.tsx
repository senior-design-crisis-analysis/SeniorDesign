import TableSkeetTable from "./components/posts_table/ExtractedInfoTable";

function DataTablePage() {
  return (
    <div className="p-6">
      <TableSkeetTable />
      <footer className="text-center mt-10 text-xs text-slate-500">
        Made with love by Professor Sarac's Team 77 at the University of Texas
        at Dallas.
      </footer>
    </div>
  );
}

export default DataTablePage;
