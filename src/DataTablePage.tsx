import TableSkeetTable from "./components/posts_table/ExtractedInfoTable";
import Nav from "./components/Nav";

function DataTablePage() {
  return (
    <div className="p-4 bg-slate-50 min-h-screen font-inter text-slate-800">
      <Nav />
      <div className="mt-[3rem] flex justify-between items-center mb-2">
        <div
          className="text-left px-2 py-2"
          style={{ color: "#020617", fontSize: "28px", fontWeight: 600 }}
        >
          All Activity
        </div>
      </div>
      <TableSkeetTable />
      <footer className="text-center mt-10 text-xs text-slate-500">
        Made with love by Professor Sarac's Team 77 at the University of Texas
        at Dallas.
      </footer>
    </div>
  );
}

export default DataTablePage;
